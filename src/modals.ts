import { Modal, App } from 'obsidian';

// 定义LogsModal类，继承自Modal类
export class LogsModal extends Modal {
    // 定义textToView变量，用于存储要显示的日志文本
    textToView: string;

    // 构造函数，接收两个参数：日志文本和Obsidian应用实例
    constructor(textToView: string, app: App) {
        super(app);
        this.textToView = textToView;
    }

    // 当模态窗口打开时调用
    onOpen() {
        let { contentEl } = this;
        let myModal = this;

        // Header
        // 创建一个div元素，用于包裹标题
        const headerWrapper = contentEl.createEl('div');
        headerWrapper.addClass('unused-images-center-wrapper');
        // 创建一个h1元素，用于显示标题
        const headerEl = headerWrapper.createEl('h1', { text: '清除未使用图片 - 日志' });
        headerEl.addClass('modal-title');

        // Information to show
        // 创建一个div元素，用于显示日志文本
        const logs = contentEl.createEl('div');
        logs.addClass('unused-images-logs');
        logs.innerHTML = this.textToView;

        // Close Button
        // 创建一个div元素，用于包裹关闭按钮
        const buttonWrapper = contentEl.createEl('div');
        buttonWrapper.addClass('unused-images-center-wrapper');
        // 创建一个button元素，用于关闭模态窗口
        const closeButton = buttonWrapper.createEl('button', { text: '关闭' });
        closeButton.addClass('unused-images-button');
        // 添加点击事件监听器，点击按钮时关闭模态窗口
        closeButton.addEventListener('click', () => {
            myModal.close();
        });
    }
}
