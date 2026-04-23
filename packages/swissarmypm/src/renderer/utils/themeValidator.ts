/**
 * 主题验证工具
 * 用于检测和报告主题问题
 */

interface ThemeIssue {
  type: 'hardcoded-color' | 'missing-transition' | 'contrast-issue';
  element: HTMLElement;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export class ThemeValidator {
  private issues: ThemeIssue[] = [];

  /**
   * 验证整个页面的主题问题
   */
  validatePage(): ThemeIssue[] {
    this.issues = [];

    // 检查硬编码的颜色
    this.checkHardcodedColors();

    // 检查缺少过渡动画的元素
    this.checkMissingTransitions();

    // 检查对比度问题
    this.checkContrast();

    return this.issues;
  }

  /**
   * 检查硬编码的颜色值
   */
  private checkHardcodedColors() {
    const problematicColors = [
      'rgb(0, 0, 0)',
      'rgb(255, 255, 255)',
      '#000',
      '#000000',
      '#fff',
      '#ffffff',
      'white',
      'black',
    ];

    const allElements = document.querySelectorAll('*');

    allElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        const computedStyle = window.getComputedStyle(element);

        // 检查背景色
        const bgColor = computedStyle.backgroundColor;
        if (problematicColors.some((color) => bgColor.includes(color))) {
          this.addIssue({
            type: 'hardcoded-color',
            element,
            message: `硬编码的背景色: ${bgColor}`,
            severity: 'warning',
          });
        }

        // 检查文字颜色
        const color = computedStyle.color;
        if (problematicColors.some((c) => color.includes(c))) {
          this.addIssue({
            type: 'hardcoded-color',
            element,
            message: `硬编码的文字颜色: ${color}`,
            severity: 'warning',
          });
        }

        // 检查内联样式
        const inlineStyle = element.getAttribute('style');
        if (inlineStyle) {
          problematicColors.forEach((problematicColor) => {
            if (
              inlineStyle.includes(`background${problematicColor}`) ||
              inlineStyle.includes(`background-color${problematicColor}`) ||
              inlineStyle.includes(`color${problematicColor}`)
            ) {
              this.addIssue({
                type: 'hardcoded-color',
                element,
                message: `内联样式包含硬编码颜色: ${problematicColor}`,
                severity: 'error',
              });
            }
          });
        }
      }
    });
  }

  /**
   * 检查缺少过渡动画的元素
   */
  private checkMissingTransitions() {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, .ant-btn, .ant-card, .ant-input'
    );

    interactiveElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        const computedStyle = window.getComputedStyle(element);
        const transition = computedStyle.transition;

        // 检查是否有颜色相关的过渡
        const hasColorTransition =
          transition.includes('background') ||
          transition.includes('color') ||
          transition.includes('all') ||
          transition.includes('ease');

        // 检查类名中是否包含主题相关的类
        const hasThemeClass =
          element.classList.contains('theme-transition') ||
          Array.from(element.classList).some((cls) => cls.includes('theme-'));

        if (!hasColorTransition && !hasThemeClass && !transition.includes('none')) {
          this.addIssue({
            type: 'missing-transition',
            element,
            message: '缺少主题切换过渡动画',
            severity: 'info',
          });
        }
      }
    });
  }

  /**
   * 检查对比度问题
   */
  private checkContrast() {
    const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, button');

    textElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        const computedStyle = window.getComputedStyle(element);
        const bgColor = computedStyle.backgroundColor;
        const color = computedStyle.color;

        // 简单的对比度检查（实际应该使用更精确的算法）
        if (this.isSimilarColor(bgColor, color)) {
          this.addIssue({
            type: 'contrast-issue',
            element,
            message: `文字颜色与背景色对比度不足 (前景色: ${color}, 背景色: ${bgColor})`,
            severity: 'error',
          });
        }
      }
    });
  }

  /**
   * 检查两个颜色是否过于相似
   */
  private isSimilarColor(color1: string, color2: string): boolean {
    // 移除 rgb() 并转换为数字
    const extractRGB = (color: string) => {
      const match = color.match(/\d+/g);
      return match ? match.map(Number) : [0, 0, 0];
    };

    const [r1, g1, b1] = extractRGB(color1);
    const [r2, g2, b2] = extractRGB(color2);

    // 计算颜色差异
    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

    // 如果差异小于 50，认为颜色过于相似
    return diff < 50;
  }

  /**
   * 添加问题
   */
  private addIssue(issue: ThemeIssue) {
    // 限制同一元素的问题数量
    const existingIssue = this.issues.find((i) => i.element === issue.element);
    if (!existingIssue) {
      this.issues.push(issue);
    }
  }

  /**
   * 在控制台打印问题报告
   */
  printReport() {
    console.group('🎨 主题验证报告');

    if (this.issues.length === 0) {
      console.log('✅ 未发现主题问题');
    } else {
      const bySeverity = this.issues.reduce(
        (acc, issue) => {
          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      console.log(`📊 总计: ${this.issues.length} 个问题`);
      console.log(`  ❌ 错误: ${bySeverity.error || 0}`);
      console.log(`  ⚠️  警告: ${bySeverity.warning || 0}`);
      console.log(`  ℹ️  信息: ${bySeverity.info || 0}`);

      console.group('Issues by severity');

      this.issues.forEach((issue, index) => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.group(`${icon} [${index + 1}] ${issue.message}`);

        const elementInfo = {
          tag: issue.element.tagName.toLowerCase(),
          classes: Array.from(issue.element.classList),
          id: issue.element.id || null,
        };

        console.log('元素信息:', elementInfo);

        if (issue.element.parentElement) {
          console.log('父元素:', issue.element.parentElement.tagName.toLowerCase());
        }

        console.groupEnd();
      });
    }

    console.groupEnd();
  }

  /**
   * 高亮显示有问题的元素
   */
  highlightIssues() {
    this.issues.forEach((issue, index) => {
      const element = issue.element;

      // 添加高亮边框
      const originalBorder = element.style.border;
      const originalOutline = element.style.outline;

      element.style.border = '2px solid red';
      element.style.outline = '2px dashed yellow';

      // 添加提示
      const tooltip = document.createElement('div');
      tooltip.textContent = `${index + 1}: ${issue.message}`;
      tooltip.style.cssText = `
        position: absolute;
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 4px 8px;
        font-size: 12px;
        z-index: 999999;
        pointer-events: none;
      `;

      const rect = element.getBoundingClientRect();
      tooltip.style.top = `${rect.top + window.scrollY}px`;
      tooltip.style.left = `${rect.left + window.scrollX}px`;

      document.body.appendChild(tooltip);

      // 3秒后移除高亮
      setTimeout(() => {
        element.style.border = originalBorder;
        element.style.outline = originalOutline;
        tooltip.remove();
      }, 3000);
    });
  }
}

/**
 * 在浏览器控制台中运行主题验证
 * 使用方法: 在控制台输入 validateTheme()
 */
declare global {
  interface Window {
    validateTheme: () => void;
    highlightThemeIssues: () => void;
  }
}

// 开发环境下暴露全局函数
if (process.env.NODE_ENV === 'development') {
  window.validateTheme = () => {
    const validator = new ThemeValidator();
    const issues = validator.validatePage();
    validator.printReport();
    return issues;
  };

  window.highlightThemeIssues = () => {
    const validator = new ThemeValidator();
    validator.validatePage();
    validator.highlightIssues();
  };

  console.log('🎨 主题验证工具已加载');
  console.log('使用方法:');
  console.log('  validateTheme() - 验证并打印报告');
  console.log('  highlightThemeIssues() - 高亮显示问题');
}

export default ThemeValidator;
