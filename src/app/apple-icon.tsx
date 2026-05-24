import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{
        fontSize: 120,
        background: '#1e40af',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        borderRadius: 32,
      }}>
        ⚓
      </div>
    ),
    { ...size }
  )
}
