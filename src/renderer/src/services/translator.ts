export interface TranslatorAdapter {
  translate(text: string): Promise<string>
}
