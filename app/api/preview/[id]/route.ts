import { NextRequest, NextResponse } from 'next/server'
import { getPreviewShare } from '@/lib/site-analyzer/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Preview ID required' },
        { status: 400 }
      )
    }
    
    const preview = await getPreviewShare(id)
    
    if (!preview) {
      return NextResponse.json(
        { success: false, error: 'Превью не найдено или срок действия истёк' },
        { status: 404 }
      )
    }
    
    // Return the HTML directly for iframe embedding
    return new NextResponse(preview.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'SAMEORIGIN',
        'Cache-Control': 'private, max-age=3600',
      },
    })
    
  } catch (error) {
    console.error('[API] preview error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка загрузки превью' },
      { status: 500 }
    )
  }
}
