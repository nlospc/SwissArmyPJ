import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const taskPath = resolve(repoRoot, 'workflow/active-task.yaml');
const schemaPath = resolve(repoRoot, 'workflow/task.schema.json');

function stripComment(line) {
  let inSingle = false;
  let inDouble = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const prev = line[index - 1];

    if (char === "'" && !inDouble) inSingle = !inSingle;
    if (char === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;
    if (char === '#' && !inSingle && !inDouble) return line.slice(0, index);
  }

  return line;
}

function parseScalar(raw) {
  const value = raw.trim();

  if (value === '') return '';
  if (value === '[]') return [];
  if (value === '{}') return {};
  if (value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);

  return value;
}

function prepareLines(source) {
  return source
    .split(/\r?\n/)
    .map((raw) => stripComment(raw).replace(/\s+$/, ''))
    .filter((line) => line.trim() !== '')
    .map((line) => ({
      indent: line.match(/^ */)[0].length,
      text: line.trim()
    }));
}

function parseYamlBlock(lines, startIndex, indent) {
  if (startIndex >= lines.length) return [{}, startIndex];

  if (lines[startIndex].indent < indent) return [{}, startIndex];

  const isList = lines[startIndex].indent === indent && lines[startIndex].text.startsWith('- ');
  const value = isList ? [] : {};
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) break;
    if (line.indent > indent) {
      throw new Error(`Unexpected indentation near "${line.text}"`);
    }

    if (isList) {
      if (!line.text.startsWith('- ')) break;

      const itemText = line.text.slice(2).trim();
      if (itemText === '') {
        const [child, nextIndex] = parseYamlBlock(lines, index + 1, indent + 2);
        value.push(child);
        index = nextIndex;
        continue;
      }

      const keyMatch = itemText.match(/^([^:]+):(?:\s*(.*))?$/);
      if (keyMatch) {
        const item = { [keyMatch[1].trim()]: parseScalar(keyMatch[2] ?? '') };
        index += 1;

        while (index < lines.length && lines[index].indent === indent + 2) {
          const childMatch = lines[index].text.match(/^([^:]+):(?:\s*(.*))?$/);
          if (!childMatch) throw new Error(`Expected key/value near "${lines[index].text}"`);

          const key = childMatch[1].trim();
          const rawValue = childMatch[2] ?? '';
          if (rawValue.trim() === '' && index + 1 < lines.length && lines[index + 1].indent > lines[index].indent) {
            const [child, nextIndex] = parseYamlBlock(lines, index + 1, lines[index + 1].indent);
            item[key] = child;
            index = nextIndex;
          } else {
            item[key] = parseScalar(rawValue);
            index += 1;
          }
        }

        value.push(item);
        continue;
      }

      value.push(parseScalar(itemText));
      index += 1;
      continue;
    }

    const match = line.text.match(/^([^:]+):(?:\s*(.*))?$/);
    if (!match) throw new Error(`Expected key/value near "${line.text}"`);

    const key = match[1].trim();
    const rawValue = match[2] ?? '';

    if (rawValue.trim() === '' && index + 1 < lines.length && lines[index + 1].indent > indent) {
      const [child, nextIndex] = parseYamlBlock(lines, index + 1, lines[index + 1].indent);
      value[key] = child;
      index = nextIndex;
    } else {
      value[key] = parseScalar(rawValue);
      index += 1;
    }
  }

  return [value, index];
}

function parseYaml(source) {
  const lines = prepareLines(source);
  if (lines.length === 0) return {};

  const [parsed, nextIndex] = parseYamlBlock(lines, 0, lines[0].indent);
  if (nextIndex < lines.length) {
    throw new Error(`Unable to parse line "${lines[nextIndex].text}"`);
  }

  return parsed;
}

function typeName(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validateSchema(schema, value, path = '$') {
  const errors = [];

  if (schema.type && typeName(value) !== schema.type) {
    errors.push(`${path} must be ${schema.type}, got ${typeName(value)}`);
    return errors;
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path} must be one of: ${schema.enum.join(', ')}`);
  }

  if (schema.type === 'object') {
    const required = schema.required ?? [];
    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(`${path}.${key} is required`);
      }
    }

    const properties = schema.properties ?? {};
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          errors.push(`${path}.${key} is not allowed`);
        }
      }
    }

    for (const [key, propertySchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validateSchema(propertySchema, value[key], `${path}.${key}`));
      }
    }
  }

  if (schema.type === 'array') {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errors.push(`${path} must contain at least ${schema.minItems} item(s)`);
    }

    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateSchema(schema.items, item, `${path}[${index}]`));
      });
    }
  }

  return errors;
}

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '' || value.trim() === 'none';
}

function validateActiveTask(task) {
  const errors = [];
  const idle = task.status === 'idle';

  if (idle) return errors;

  if (isBlank(task.task_id)) errors.push('task_id must be set when status is not idle');
  if (isBlank(task.title)) errors.push('title must be set when status is not idle');
  if (isBlank(task.intent.goal)) errors.push('intent.goal must be set when status is not idle');
  if (isBlank(task.execution_package.spec)) {
    errors.push('execution_package.spec must be set when status is not idle');
  }

  const requiredArrays = [
    ['intent.non_goals', task.intent.non_goals],
    ['intent.invariants', task.intent.invariants],
    ['intent.constraints', task.intent.constraints],
    ['intent.success_metrics', task.intent.success_metrics],
    ['intent.unacceptable_shortcuts', task.intent.unacceptable_shortcuts],
    ['execution_package.acceptance', task.execution_package.acceptance],
    ['execution_package.edge_cases', task.execution_package.edge_cases],
    ['execution_package.verification_checklist', task.execution_package.verification_checklist],
    ['execution_package.forbidden_changes', task.execution_package.forbidden_changes],
    ['execution_package.task_contract.allowed_paths', task.execution_package.task_contract.allowed_paths],
    ['execution_package.task_contract.forbidden_paths', task.execution_package.task_contract.forbidden_paths],
    ['execution_package.task_contract.required_outputs', task.execution_package.task_contract.required_outputs],
    ['current_agreement.assumptions', task.current_agreement.assumptions],
    ['current_agreement.boundaries', task.current_agreement.boundaries],
    ['current_agreement.acceptance_mapping', task.current_agreement.acceptance_mapping]
  ];

  for (const [field, value] of requiredArrays) {
    if (!Array.isArray(value) || value.length === 0) {
      errors.push(`${field} must contain at least one item when status is not idle`);
    }
  }

  const acceptanceIds = new Set(task.execution_package.acceptance.map((item) => item.id));
  for (const mapping of task.current_agreement.acceptance_mapping) {
    if (!acceptanceIds.has(mapping.acceptance_id)) {
      errors.push(
        `current_agreement.acceptance_mapping references unknown acceptance id "${mapping.acceptance_id}"`
      );
    }
  }

  return errors;
}

function main() {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const task = parseYaml(readFileSync(taskPath, 'utf8'));

  const errors = [...validateSchema(schema, task), ...validateActiveTask(task)];

  if (errors.length > 0) {
    console.error('[workflow-verify] active task validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log('[workflow-verify] active task is valid');
}

main();
