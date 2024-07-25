import OzanClearImages from './main';
import { PluginSettingTab, Setting, App } from 'obsidian';

export interface OzanClearImagesSettings {
    deleteOption: string;
    logsModal: boolean;
    excludedFolders: string;
    ribbonIcon: boolean;
    excludeSubfolders: boolean;
}

export const DEFAULT_SETTINGS: OzanClearImagesSettings = {
    deleteOption: '.trash',
    logsModal: true,
    excludedFolders: '',
    ribbonIcon: false,
    excludeSubfolders: false,
};

export class OzanClearImagesSettingsTab extends PluginSettingTab {
    plugin: OzanClearImages;

    constructor(app: App, plugin: OzanClearImages) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: '清除图片插件设置' });

        new Setting(containerEl)
            .setName('左侧边栏图标')
            .setDesc('如果你想要在左侧边栏上显示清除图片的图标，请打开此选项。')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.ribbonIcon).onChange((value) => {
                    this.plugin.settings.ribbonIcon = value;
                    this.plugin.saveSettings();
                    this.plugin.refreshIconRibbon();
                })
            );

        new Setting(containerEl)
            .setName('删除日志提示')
            .setDesc(
                '如果你不想在删除完成后看到删除日志的窗口，请关闭此选项。(要是没有图片被删除，它将不会出现)'
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.logsModal).onChange((value) => {
                    this.plugin.settings.logsModal = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('图像删除后的目标位置')
            .setDesc('选择图像删除后要移动的位置')
            .addDropdown((dropdown) => {
                dropdown.addOption('permanent', '永久删除');
                dropdown.addOption('.trash', '移动到Obsidian回收站');
                dropdown.addOption('system-trash', '移动到系统回收站');
                dropdown.setValue(this.plugin.settings.deleteOption);
                dropdown.onChange((option) => {
                    this.plugin.settings.deleteOption = option;
                    this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName('排除文件夹的完整路径')
            .setDesc(
                `提供要排除的文件夹名称的完整路径（区分大小写），用逗号（,）分隔。例如，对于Personal/Files/Zodiac下的图片，应该使用Personal/Files/Zodiac进行排除。`
            )

            .addTextArea((text) =>
                text.setValue(this.plugin.settings.excludedFolders).onChange((value) => {
                    this.plugin.settings.excludedFolders = value;
                    this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('排除子文件夹')
            .setDesc('如果你想要排除上面提供的文件夹路径下的所有子文件夹，请打开此选项。')

            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.excludeSubfolders).onChange((value) => {
                    this.plugin.settings.excludeSubfolders = value;
                    this.plugin.saveSettings();
                })
            );

        const coffeeDiv = containerEl.createDiv('coffee');
        coffeeDiv.addClass('oz-coffee-div');
        const coffeeLink = coffeeDiv.createEl('a', { href: 'https://ko-fi.com/L3L356V6Q' });
        const coffeeImg = coffeeLink.createEl('img', {
            attr: {
                src: 'https://cdn.ko-fi.com/cdn/kofi2.png?v=3',
            },
        });
        coffeeImg.height = 45;
    }
}
