'use client';
import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
export function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal()},[]);
 return <dialog ref={ref} className={wide?'modal narrated-modal':'modal'} aria-label={title} onClose={onClose} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close()}}}><button className="close" aria-label="Close dialog" onClick={()=>ref.current?.close()}><X size={18}/></button>{children}</dialog>
}
