import { TFile, App } from 'obsidian';

/* -------------------- 链接检测器 -------------------- */

type LinkType = 'markdown' | 'wiki' | 'wikiTransclusion' | 'mdTransclusion';

export interface LinkMatch {
    type: LinkType;
    match: string;
    linkText: string;
    sourceFilePath: string;
}

/**
 *
 * @param mdFile : 要扫描的文件
 * @param app : Obsidian应用实例
 * @param fileText : 可选，如果文件不是Md格式，请提供fileText进行扫描
 * @returns Promise<LinkMatch[]>
 */

export const getAllLinkMatchesInFile = async (mdFile: TFile, app: App, fileText?: String): Promise<LinkMatch[]> => {
    const linkMatches: LinkMatch[] = [];
    if (fileText === undefined) {
        fileText = await app.vault.read(mdFile);
    }

    // --> 获取所有Wiki链接
    let wikiRegex = /\[\[.*?\]\]/g;
    let wikiMatches = fileText.match(wikiRegex);
    if (wikiMatches) {
        let fileRegex = /(?<=\[\[).*?(?=(\]|\|))/;

        for (let wikiMatch of wikiMatches) {
            // --> 检查是否是转义链接
            if (matchIsWikiTransclusion(wikiMatch)) {
                let fileName = getTransclusionFileName(wikiMatch);
                let file = app.metadataCache.getFirstLinkpathDest(fileName, mdFile.path);
                if (fileName !== '') {
                    let linkMatch: LinkMatch = {
                        type: 'wikiTransclusion',
                        match: wikiMatch,
                        linkText: file ? file.path : fileName,
                        sourceFilePath: mdFile.path,
                    };
                    linkMatches.push(linkMatch);
                    continue;
                }
            }
            // --> 正常的内部链接
            let fileMatch = wikiMatch.match(fileRegex);
            if (fileMatch) {
                // 跳过网页链接
                if (fileMatch[0].startsWith('http')) continue;
                let file = app.metadataCache.getFirstLinkpathDest(fileMatch[0], mdFile.path);
                let linkMatch: LinkMatch = {
                    type: 'wiki',
                    match: wikiMatch,
                    linkText: file ? file.path : fileMatch[0],
                    sourceFilePath: mdFile.path,
                };
                linkMatches.push(linkMatch);
            }
        }
    }

    // --> 获取所有Markdown链接
    let markdownRegex = /\[(^$|.*?)\]\((.*?)\)/g;
    let markdownMatches = fileText.match(markdownRegex);
    if (markdownMatches) {
        let fileRegex = /(?<=\().*(?=\))/;
        for (let markdownMatch of markdownMatches) {
            // --> 检查是否是转义链接
            if (matchIsMdTransclusion(markdownMatch)) {
                let fileName = getTransclusionFileName(markdownMatch);
                let file = app.metadataCache.getFirstLinkpathDest(fileName, mdFile.path);
                if (fileName !== '') {
                    let linkMatch: LinkMatch = {
                        type: 'mdTransclusion',
                        match: markdownMatch,
                        linkText: file ? file.path : fileName,
                        sourceFilePath: mdFile.path,
                    };
                    linkMatches.push(linkMatch);
                    continue;
                }
            }
            // --> 正常的内部链接
            let fileMatch = markdownMatch.match(fileRegex);
            if (fileMatch) {
                // 跳过网页链接
                if (fileMatch[0].startsWith('http')) continue;
                let file = app.metadataCache.getFirstLinkpathDest(fileMatch[0], mdFile.path);
                let linkMatch: LinkMatch = {
                    type: 'markdown',
                    match: markdownMatch,
                    linkText: file ? file.path : fileMatch[0],
                    sourceFilePath: mdFile.path,
                };
                linkMatches.push(linkMatch);
            }
        }
    }
    return linkMatches;
};

/* ---------- 辅助函数 ---------- */

const wikiTransclusionRegex = /\[\[(.*?)#.*?\]\]/;
const wikiTransclusionFileNameRegex = /(?<=\[\[)(.*)(?=#)/;

const mdTransclusionRegex = /\[.*?]\((.*?)#.*?\)/;
const mdTransclusionFileNameRegex = /(?<=\]\()(.*)(?=#)/;

const matchIsWikiTransclusion = (match: string): boolean => {
    return wikiTransclusionRegex.test(match);
};

const matchIsMdTransclusion = (match: string): boolean => {
    return mdTransclusionRegex.test(match);
};

/**
 * @param match
 * @returns 如果有匹配项则返回文件名，否则返回空字符串
 */

const getTransclusionFileName = (match: string): string => {
    let isWiki = wikiTransclusionRegex.test(match);
    let isMd = mdTransclusionRegex.test(match);
    if (isWiki || isMd) {
        let fileNameMatch = match.match(isWiki ? wikiTransclusionFileNameRegex : mdTransclusionFileNameRegex);
        if (fileNameMatch) return fileNameMatch[0];
    }
    return '';
};
