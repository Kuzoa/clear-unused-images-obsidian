import { Plugin, TFile, Notice } from 'obsidian';
import { OzanClearImagesSettingsTab } from './settings';
import { OzanClearImagesSettings, DEFAULT_SETTINGS } from './settings';
import { LogsModal } from './modals';
import * as Util from './util';

// 定义OzanClearImages类，继承自Plugin类
export default class OzanClearImages extends Plugin {
    // 定义settings变量，用于存储插件设置
    settings: OzanClearImagesSettings;
    // 定义ribbonIconEl变量，用于存储插件的图标元素
    ribbonIconEl: HTMLElement | undefined = undefined;

    // 插件加载时调用
    async onload() {
        console.log('"Clear Unused Images 插件已加载..."');
        // 添加设置选项卡
        this.addSettingTab(new OzanClearImagesSettingsTab(this.app, this));
        // 加载设置
        await this.loadSettings();
        // 添加命令
        this.addCommand({
            id: 'clear-images-obsidian',
            name: 'Clear Unused Images',
            callback: () => this.clearUnusedAttachments('image'),
        });
        this.addCommand({
            id: 'clear-unused-attachments',
            name: 'Clear Unused Attachments',
            callback: () => this.clearUnusedAttachments('all'),
        });
        // 刷新图标
        this.refreshIconRibbon();
    }

    // 插件卸载时调用
    onunload() {
        console.log('"Clear Unused Images 插件已卸载..."');
    }

    // 加载设置
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    // 保存设置
    async saveSettings() {
        await this.saveData(this.settings);
    }

    // 刷新图标
    refreshIconRibbon = () => {
        this.ribbonIconEl?.remove();
        if (this.settings.ribbonIcon) {
            this.ribbonIconEl = this.addRibbonIcon('image-file', 'Clear Unused Images', (event): void => {
                this.clearUnusedAttachments('image');
            });
        }
    };

    // 比较已使用的图片和所有图片，返回未使用的图片
    clearUnusedAttachments = async (type: 'all' | 'image') => {
        var unusedAttachments: TFile[] = await Util.getUnusedAttachments(this.app, type);
        var len = unusedAttachments.length;
        if (len > 0) {
            let logs = '';
            logs += `[+] ${Util.getFormattedDate()}: 开始清理</br>`;
            Util.deleteFilesInTheList(unusedAttachments, this, this.app).then(({ deletedImages, textToView }) => {
                logs += textToView;
                logs += '[+] ' + deletedImages.toString() + ' 张图片已删除.</br>'
;
                logs += `[+] ${Util.getFormattedDate()}: 清理完成`;
                if (this.settings.logsModal) {
                    let modal = new LogsModal(logs, this.app);
                    modal.open();
                }
            });
        } else {
            new Notice(`所有 ${type === 'image' ? '图片' : '附件'} 都在使用中。没有删除任何内容。`
);
        }
    };
}
