import { App, TFile } from 'obsidian';
import { LinkMuseSettings } from '../settings';
import { LLMService } from './llm-service';

// 定义潜在链接接口
export interface PotentialLink {
    noteName: string;
    notePath: string;
    relevanceScore: number;
    content: string;
}

export class NoteLinkService {
    private app: App;
    private settings: LinkMuseSettings;
    private llmService: LLMService;

    constructor(settings: LinkMuseSettings, app: App) {
        this.settings = settings;
        this.app = app;
    }

    // 获取笔记中已存在的链接
    private getExistingLinks(noteContent: string): string[] {
        const linkRegex = /\[\[([^\]]+)\]\]/g;
        const links: string[] = [];
        let match;

        while ((match = linkRegex.exec(noteContent)) !== null) {
            links.push(match[1]);
        }

        return links;
    }

    // 分析潜在的笔记链接
    async analyzePotentialLinks(currentFile: TFile, content: string): Promise<PotentialLink[]> {
        try {
            if (!currentFile) {
                throw new Error("当前文件不存在");
            }
            
            console.log(`开始分析笔记: ${currentFile.name}`);
            
            // 获取当前笔记内容
            if (!content) {
                console.log("尝试从磁盘读取笔记内容");
                content = await this.app.vault.read(currentFile);
            }
            
            // 获取当前笔记已有的链接
            const existingLinks = this.getExistingLinks(content);
            console.log(`笔记 ${currentFile.name} 内容长度: ${content.length} 字符，已有链接数: ${existingLinks.length}`);
            
            // 获取所有可用笔记
            const allNotes = this.app.vault.getMarkdownFiles();
            
            // 过滤出需要分析的笔记（排除当前笔记和已链接的笔记）
            const notesToAnalyze = allNotes.filter(note => {
                // 排除当前笔记
                if (note.path === currentFile.path) {
                    return false;
                }
                
                // 排除已经链接的笔记
                if (existingLinks.includes(note.basename)) {
                    return false;
                }
                
                return true;
            });
            
            console.log(`总笔记数: ${allNotes.length}，待分析笔记数: ${notesToAnalyze.length}`);
            
            // 限制要分析的笔记数量
            const limitedNotes = this.limitNotesForAnalysis(notesToAnalyze, this.settings.maxNotesToAnalyze);
            console.log(`限制后的分析笔记数: ${limitedNotes.length}`);
            
            if (limitedNotes.length === 0) {
                console.log("没有需要分析的笔记，返回空结果");
                return [];
            }
            
            // 初始化LLM服务
            const llmService = new LLMService(this.settings, this.app);
            
            // 分析每个笔记与当前笔记的相关性
            const potentialLinks: PotentialLink[] = [];
            console.log(`开始分析 ${limitedNotes.length} 个笔记的相关性...`);
            
            for (const note of limitedNotes) {
                try {
                    // 读取目标笔记内容
                    const noteContent = await this.app.vault.read(note);
                    
                    // 使用LLM分析相关性
                    const relevanceResult = await llmService.analyzeNoteRelevance(
                        currentFile.basename,
                        note.basename,
                        content,
                        noteContent
                    );
                    
                    console.log(`笔记 "${note.basename}" 相关性: ${relevanceResult.relevanceScore.toFixed(2)}`);
                    
                    // 添加到潜在链接列表
                    potentialLinks.push({
                        noteName: note.basename,
                        notePath: note.path,
                        relevanceScore: relevanceResult.relevanceScore,
                        content: relevanceResult.explanation
                    });
                } catch (noteError) {
                    console.error(`分析笔记 ${note.basename} 时出错:`, noteError);
                }
            }
            
            // 按相关性分数排序
            const sortedLinks = potentialLinks.sort((a, b) => b.relevanceScore - a.relevanceScore);
            
            // 限制返回数量
            const result = sortedLinks.slice(0, this.settings.maxLinksToGenerate || 5);
            console.log(`分析完成，最终生成的潜在链接数: ${result.length}`);
            
            return result;
        } catch (error) {
            console.error("分析潜在链接时出错:", error);
            console.error("错误详情:", error.message);
            return [];
        }
    }

    // 使用LLM分析两个笔记之间的关联性
    private async analyzeRelevance(title1: string, title2: string, content1: string, content2: string): Promise<{
        explanation: string,
        relevanceScore: number
    }> {
        // 使用LLMService的analyzeNoteRelevance方法进行分析
        return await this.llmService.analyzeNoteRelevance(
            title1,
            title2,
            content1,
            content2
        );
    }

    // 限制要分析的笔记数量
    private limitNotesForAnalysis(notes: TFile[], maxCount: number): TFile[] {
        // 如果笔记数量已经小于等于最大值，直接返回
        if (notes.length <= maxCount) {
            return notes;
        }
        
        // 随机选择笔记
        return this.getRandomElements(notes, maxCount);
    }
    
    // 从数组中随机获取n个元素
    private getRandomElements<T>(array: T[], n: number): T[] {
        const result = new Array<T>(n);
        const len = array.length;
        const taken = new Set<number>();
        
        if (n > len) {
            return array.slice();
        }
        
        while (result.filter(x => x !== undefined).length < n) {
            const x = Math.floor(Math.random() * len);
            if (!taken.has(x)) {
                result[result.filter(x => x !== undefined).length] = array[x];
                taken.add(x);
            }
        }
        
        return result;
    }
}