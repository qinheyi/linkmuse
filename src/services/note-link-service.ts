import { App, TFile } from 'obsidian';
import { LLMService } from './llm-service';

export class NoteLinkService {
    private app: App;
    private llmService: LLMService;

    constructor(app: App, llmService: LLMService) {
        this.app = app;
        this.llmService = llmService;
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

    // 分析笔记潜在关联
    async analyzePotentialLinks(currentNote: TFile, maxNotesToAnalyze: number): Promise<Array<{
        noteName: string,
        content: string,
        relevanceScore: number
    }>> {
        // 获取当前笔记内容
        const currentContent = await this.app.vault.read(currentNote);
        
        // 获取已存在的链接
        const existingLinks = this.getExistingLinks(currentContent);

        // 获取所有笔记
        const allNotes = this.app.vault.getMarkdownFiles();

        // 过滤掉已有链接的笔记和当前笔记
        const notesToAnalyze = allNotes.filter(note => 
            note.path !== currentNote.path && 
            !existingLinks.includes(note.basename)
        ).slice(0, maxNotesToAnalyze);

        const potentialLinks = [];

        // 分析每个笔记的潜在关联
        for (const note of notesToAnalyze) {
            const noteContent = await this.app.vault.read(note);
            
            // 使用LLM分析关联性
            const analysis = await this.analyzeRelevance(currentNote.basename, note.basename, currentContent, noteContent);
            
            if (analysis.relevanceScore > 0) {
                potentialLinks.push({
                    noteName: note.basename,
                    content: analysis.explanation,
                    relevanceScore: analysis.relevanceScore
                });
            }
        }

        // 按关联度排序
        return potentialLinks.sort((a, b) => b.relevanceScore - a.relevanceScore);
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
}