import { App, TFile } from 'obsidian';
import OzanClearImages from './main';
import { getAllLinkMatchesInFile, LinkMatch } from './linkDetector';

/* ------------------ 图像处理程序  ------------------ */

const imageRegex = /.*(jpe?g|png|gif|svg|bmp)/i;
const bannerRegex = /!\[\[(.*?)\]\]/i;
const imageExtensions: Set<string> = new Set(['jpeg', 'jpg', 'png', 'gif', 'svg', 'bmp']);

// 创建未使用图片的列表
export const getUnusedAttachments = async (app: App, type: 'image' | 'all') => {
    var allAttachmentsInVault: TFile[] = getAttachmentsInVault(app, type);
    var unusedAttachments: TFile[] = [];
    var usedAttachmentsSet: Set<string>;

    // 获取所有Markdown文件中使用的附件
    usedAttachmentsSet = await getAttachmentPathSetForVault(app);

    // 比较所有附件和已使用的附件
    allAttachmentsInVault.forEach((attachment) => {
        if (!usedAttachmentsSet.has(attachment.path)) unusedAttachments.push(attachment);
    });

    return unusedAttachments;
};

// 获取Vault中所有可用的图片文件
const getAttachmentsInVault = (app: App, type: 'image' | 'all'): TFile[] => {
    let allFiles: TFile[] = app.vault.getFiles();
    let attachments: TFile[] = [];
    for (let i = 0; i < allFiles.length; i++) {
        if (!['md', 'canvas'].includes(allFiles[i].extension)) {
            // 只获取图片
            if (imageExtensions.has(allFiles[i].extension.toLowerCase())) {
                attachments.push(allFiles[i]);
            }
            // 所有文件
            else if (type === 'all') {
                attachments.push(allFiles[i]);
            }
        }
    }
    return attachments;
};

// 获取Vault中所有已使用的附件路径
const getAttachmentPathSetForVault = async (app: App): Promise<Set<string>> => {
    var attachmentsSet: Set<string> = new Set();
    var resolvedLinks = app.metadataCache.resolvedLinks;
    if (resolvedLinks) {
        for (const [mdFile, links] of Object.entries(resolvedLinks)) {
            for (const [filePath, nr] of Object.entries(resolvedLinks[mdFile])) {
                if (!(filePath as String).endsWith('.md')) {
                    attachmentsSet.add(filePath);
                }
            }
        }
    }
    // 遍历文件并检查Frontmatter/Canvas
    let allFiles = app.vault.getFiles();
    for (let i = 0; i < allFiles.length; i++) {
        let obsFile = allFiles[i];
        // 检查md文件的前言和可能未在resolved links中遗漏的附加链接
        if (obsFile.extension === 'md') {
            // 前言
            let fileCache = app.metadataCache.getFileCache(obsFile);
            if (fileCache.frontmatter) {
                let frontmatter = fileCache.frontmatter;
                for (let k of Object.keys(frontmatter)) {
                    if (typeof frontmatter[k] === 'string') {
                        if (frontmatter[k].match(bannerRegex)) {
                            let fileName = frontmatter[k].match(bannerRegex)[1];
                            let file = app.metadataCache.getFirstLinkpathDest(fileName, obsFile.path);
                            if (file) {
                                addToSet(attachmentsSet, file.path);
                            }
                        } else if (pathIsAnImage(frontmatter[k])) {
                            addToSet(attachmentsSet, frontmatter[k]);
                        }
                    }
                }
            }
            // 任何其他链接
            let linkMatches: LinkMatch[] = await getAllLinkMatchesInFile(obsFile, app);
            for (let linkMatch of linkMatches) {
                addToSet(attachmentsSet, linkMatch.linkText);
            }
        }
        // 检查Canvas中的链接
        else if (obsFile.extension === 'canvas') {
            let fileRead = await app.vault.cachedRead(obsFile);
            let canvasData = JSON.parse(fileRead);
            if (canvasData.nodes && canvasData.nodes.length > 0) {
                for (const node of canvasData.nodes) {
                    // node.type: 'text' | 'file'
                    if (node.type === 'file') {
                        addToSet(attachmentsSet, node.file);
                    } else if (node.type == 'text') {
                        let linkMatches: LinkMatch[] = await getAllLinkMatchesInFile(obsFile, app, node.text);
                        for (let linkMatch of linkMatches) {
                            addToSet(attachmentsSet, linkMatch.linkText);
                        }
                    }
                }
            }
        }
    }
    return attachmentsSet;
};

const pathIsAnImage = (path: string) => {
    return path.match(imageRegex);
};

/* ------------------ 删除处理程序  ------------------ */

// 从提供的列表中清除图片
export const deleteFilesInTheList = async (
    fileList: TFile[],
    plugin: OzanClearImages,
    app: App
): Promise<{ deletedImages: number; textToView: string }> => {
    var deleteOption = plugin.settings.deleteOption;
    var deletedImages = 0;
    let textToView = '';
    for (let file of fileList) {
        if (fileIsInExcludedFolder(file, plugin)) {
            console.log('文件未被引用但已排除: ' + file.path);
        } else {
            if (deleteOption === '.trash') {
                await app.vault.trash(file, false);
                textToView += `[+] 移动到Obsidian回收站: ` + file.path + '</br>';
            } else if (deleteOption === 'system-trash') {
                await app.vault.trash(file, true);
                textToView += `[+] 移动到系统回收站: ` + file.path + '</br>';
            } else if (deleteOption === 'permanent') {
                await app.vault.delete(file);
                textToView += `[+] 永久删除: ` + file.path + '</br>';
            }
            deletedImages++;
        }
    }
    return { deletedImages, textToView };
};

// 检查文件是否在排除的文件夹中
const fileIsInExcludedFolder = (file: TFile, plugin: OzanClearImages): boolean => {
    var excludedFoldersSettings = plugin.settings.excludedFolders;
    var excludeSubfolders = plugin.settings.excludeSubfolders;
    if (excludedFoldersSettings === '') {
        return false;
    } else {
        // 获取所有排除的文件夹路径
        var excludedFolderPaths = new Set(
            excludedFoldersSettings.split(',').map((folderPath) => {
                return folderPath.trim();
            })
        );

        if (excludeSubfolders) {
            // 如果包含子文件夹，检查任何提供的路径是否部分匹配
            for (let exludedFolderPath of excludedFolderPaths) {
                var pathRegex = new RegExp(exludedFolderPath + '.*');
                if (file.parent.path.match(pathRegex)) {
                    return true;
                }
            }
        } else {
            // 如果不包含子文件夹，父路径应完全匹配
            if (excludedFolderPaths.has(file.parent.path)) {
                return true;
            }
        }

        return false;
    }
};

/* ------------------ 辅助函数  ------------------ */

export const getFormattedDate = () => {
    let dt = new Date();
    return dt.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const addToSet = (setObj: Set<string>, value: string) => {
    if (!setObj.has(value)) {
        setObj.add(value);
    }
};
