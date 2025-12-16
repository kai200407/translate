import axios from 'axios';

export interface TranslateResult {
    engine: string;
    result: string;
    time?: number;
    error?: string;
}

// 谷歌翻译（使用代理）
export async function googleTranslate(text: string, from = 'auto', to = 'zh-CN'): Promise<TranslateResult> {
    const start = Date.now();
    try {
        const url = `/api/google/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await axios.get(url, { timeout: 15000 });
        const result = response.data[0].map((item: any[]) => item[0]).join('');
        return { engine: '谷歌翻译', result, time: Date.now() - start };
    } catch (error: any) {
        return { engine: '谷歌翻译', result: '', time: Date.now() - start, error: error.message || '翻译失败' };
    }
}

// 百度翻译（使用代理）
export async function baiduTranslate(text: string): Promise<TranslateResult> {
    const start = Date.now();
    try {
        const url = `/api/baidu/sug`;
        const response = await axios.post(url, `kw=${encodeURIComponent(text)}`, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000
        });
        if (response.data.data && response.data.data.length > 0) {
            return { engine: '百度翻译', result: response.data.data[0].v, time: Date.now() - start };
        }
        return { engine: '百度翻译', result: '', time: Date.now() - start, error: '无翻译结果' };
    } catch (error: any) {
        return { engine: '百度翻译', result: '', time: Date.now() - start, error: error.message || '翻译失败' };
    }
}

// 有道翻译（使用代理）
export async function youdaoTranslate(text: string): Promise<TranslateResult> {
    const start = Date.now();
    try {
        const url = `/api/youdao/suggest?num=1&doctype=json&q=${encodeURIComponent(text)}`;
        const response = await axios.get(url, { timeout: 15000 });
        if (response.data.data && response.data.data.entries && response.data.data.entries.length > 0) {
            return { engine: '有道翻译', result: response.data.data.entries[0].explain, time: Date.now() - start };
        }
        return { engine: '有道翻译', result: '', time: Date.now() - start, error: '无翻译结果' };
    } catch (error: any) {
        return { engine: '有道翻译', result: '', time: Date.now() - start, error: error.message || '翻译失败' };
    }
}

// AI翻译（使用Ollama本地模型）
export async function aiTranslate(text: string, targetLang = 'zh-CN'): Promise<TranslateResult> {
    const start = Date.now();
    try {
        const langMap: Record<string, string> = {
            'zh-CN': '中文', 'en': 'English', 'ja': '日本語',
            'ko': '한국어', 'fr': 'Français', 'de': 'Deutsch'
        };
        const targetName = langMap[targetLang] || '中文';
        const url = 'http://localhost:11434/api/generate';
        const prompt = `请将以下文本翻译成${targetName}，只返回翻译结果：\n\n${text}`;

        const response = await axios.post(url, {
            model: 'qwen2.5:7b',
            prompt,
            stream: false
        }, { timeout: 30000 });

        return { engine: 'AI翻译', result: response.data.response?.trim() || '', time: Date.now() - start };
    } catch (error: any) {
        return { engine: 'AI翻译', result: '', time: Date.now() - start, error: 'Ollama未启动' };
    }
}

// 翻译所有引擎
export async function translateAll(text: string, engine = 'all', targetLang = 'zh-CN'): Promise<TranslateResult[]> {
    const engineMap: Record<string, () => Promise<TranslateResult>> = {
        google: () => googleTranslate(text, 'auto', targetLang),
        baidu: () => baiduTranslate(text),
        youdao: () => youdaoTranslate(text),
        ai: () => aiTranslate(text, targetLang),
    };

    if (engine !== 'all' && engineMap[engine]) {
        try {
            const result = await engineMap[engine]();
            return [result];
        } catch {
            return [{ engine: engine, result: '', error: '翻译失败' }];
        }
    }

    const results = await Promise.allSettled([
        googleTranslate(text, 'auto', targetLang),
        baiduTranslate(text),
        youdaoTranslate(text),
        aiTranslate(text, targetLang),
    ]);

    return results.map((result) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        return { engine: '未知', result: '', error: '翻译失败' };
    });
}
