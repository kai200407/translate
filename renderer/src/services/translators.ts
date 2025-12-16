import axios from 'axios';

export interface TranslateResult {
    engine: string;
    result: string;
    error?: string;
}

// 谷歌翻译（免费API，可能需要代理）
export async function googleTranslate(text: string, from = 'auto', to = 'zh-CN'): Promise<TranslateResult> {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await axios.get(url, { timeout: 10000 });
        const result = response.data[0].map((item: any[]) => item[0]).join('');
        return { engine: '谷歌翻译', result };
    } catch (error: any) {
        return { engine: '谷歌翻译', result: '', error: error.message || '翻译失败' };
    }
}

// 百度翻译（免费API，无需密钥的简易版本）
export async function baiduTranslate(text: string, _from = 'auto', _to = 'zh'): Promise<TranslateResult> {
    try {
        // 使用百度翻译的网页版API
        const url = `https://fanyi.baidu.com/sug`;
        const response = await axios.post(url, `kw=${encodeURIComponent(text)}`, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000
        });
        if (response.data.data && response.data.data.length > 0) {
            return { engine: '百度翻译', result: response.data.data[0].v };
        }
        return { engine: '百度翻译', result: '', error: '无翻译结果' };
    } catch (error: any) {
        return { engine: '百度翻译', result: '', error: error.message || '翻译失败' };
    }
}

// 有道翻译（免费API）
export async function youdaoTranslate(text: string): Promise<TranslateResult> {
    try {
        const url = `https://dict.youdao.com/suggest?num=1&doctype=json&q=${encodeURIComponent(text)}`;
        const response = await axios.get(url, { timeout: 10000 });
        if (response.data.data && response.data.data.entries && response.data.data.entries.length > 0) {
            return { engine: '有道翻译', result: response.data.data.entries[0].explain };
        }
        return { engine: '有道翻译', result: '', error: '无翻译结果' };
    } catch (error: any) {
        return { engine: '有道翻译', result: '', error: error.message || '翻译失败' };
    }
}

// 必应翻译（需要API密钥，暂未实现）
// export async function bingTranslate(...) { ... }

// AI翻译（使用免费的Ollama本地模型或其他API）
export async function aiTranslate(text: string, _apiKey?: string, apiUrl?: string): Promise<TranslateResult> {
    try {
        // 默认使用Ollama本地API
        const url = apiUrl || 'http://localhost:11434/api/generate';
        const prompt = `请将以下文本翻译成中文，只返回翻译结果，不要任何解释：\n\n${text}`;

        const response = await axios.post(url, {
            model: 'qwen2.5:7b',
            prompt,
            stream: false
        }, { timeout: 30000 });

        return { engine: 'AI翻译', result: response.data.response?.trim() || '' };
    } catch (error: any) {
        // 如果Ollama不可用，尝试使用其他免费API
        return { engine: 'AI翻译', result: '', error: '请确保Ollama已启动或配置其他AI API' };
    }
}

// 翻译所有引擎
export async function translateAll(text: string, engine = 'all', targetLang = 'zh-CN'): Promise<TranslateResult[]> {
    const engineMap: Record<string, () => Promise<TranslateResult>> = {
        google: () => googleTranslate(text, 'auto', targetLang),
        baidu: () => baiduTranslate(text),
        youdao: () => youdaoTranslate(text),
        ai: () => aiTranslate(text),
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
        aiTranslate(text),
    ]);

    return results.map((result) => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        return { engine: '未知', result: '', error: '翻译失败' };
    });
}
