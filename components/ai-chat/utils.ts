// --- Session ID Generator ---
export function generateSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// --- Markdown parser ---
export function parseMarkdown(text: string): { key: number; html: string }[] {
  return text.split("\n").map((line, i) => {
    let html = line
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-secondary text-xs font-mono">$1</code>')
    if (line.startsWith("- ")) {
      html = `<span class="text-primary mr-1">&#8226;</span>${html.slice(2)}`
    }
    return {
      key: i,
      html: html || "&nbsp;",
    }
  })
}
