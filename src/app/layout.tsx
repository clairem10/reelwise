import type {Metadata,Viewport} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Reelwise · Learn a little. Keep a lot.',description:'Short probability lessons, quick checks, and your learning progress.',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg',apple:'/icon.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#FFFDF7'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
