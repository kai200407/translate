import Tesseract from 'tesseract.js';

export interface OCRResult {
    text: string;
    confidence: number;
    error?: string;
}

export async function recognizeImage(imageDataUrl: string): Promise<OCRResult> {
    try {
        const result = await Tesseract.recognize(imageDataUrl, 'eng+chi_sim', {
            logger: (m) => console.log(m),
        });

        return {
            text: result.data.text.trim(),
            confidence: result.data.confidence,
        };
    } catch (error: any) {
        return {
            text: '',
            confidence: 0,
            error: error.message || 'OCR识别失败',
        };
    }
}

export async function recognizeImageFromFile(file: File): Promise<OCRResult> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target?.result as string;
            const result = await recognizeImage(dataUrl);
            resolve(result);
        };
        reader.onerror = () => {
            resolve({ text: '', confidence: 0, error: '读取文件失败' });
        };
        reader.readAsDataURL(file);
    });
}
