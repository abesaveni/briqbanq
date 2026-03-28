import React from 'react';
import { Paperclip, Send } from 'lucide-react';

export default function MessagesTab({ caseMessages, newMessageText, setNewMessageText, handleSendGeneralMessage }) {
    return (
        <div className="bg-white border border-gray-100 rounded-[20px] overflow-hidden flex flex-col shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-[15px] font-bold text-slate-800">Case Messages</h3>
                    <p className="text-[11px] text-gray-400 font-medium">Direct communication with parties</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Online</p>
                </div>
            </div>
            <div className="max-h-[350px] overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/10">
                {caseMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 shadow-sm ${msg.avatarColor}`}>
                            {msg.initials}
                        </div>
                        <div className={`flex flex-col max-w-[75%] ${msg.isMe ? 'items-end' : ''}`}>
                            <div className={`flex items-baseline gap-2 mb-1.5 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[12px] font-bold text-slate-800">{msg.user}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{msg.role}</span>
                            </div>
                            <div className={`px-4 py-2.5 rounded-[18px] text-[13px] font-medium leading-relaxed shadow-sm ${msg.isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'
                                }`}>
                                {msg.message}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wide">{msg.time}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="bg-slate-50 border border-gray-200 rounded-[16px] p-1.5 flex items-center gap-2 shadow-inner">
                    <textarea
                        rows={1}
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendGeneralMessage())}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent px-3 py-2 text-[13px] font-medium outline-none resize-none placeholder:text-gray-400 h-[38px]"
                    ></textarea>
                    <div className="flex gap-1.5 pr-1">
                        <button className="p-2 text-gray-400 hover:bg-white hover:text-gray-600 rounded-lg transition-all shadow-sm hover:shadow-md">
                            <Paperclip size={16} />
                        </button>
                        <button
                            onClick={handleSendGeneralMessage}
                            className="bg-blue-900 text-white p-2.5 rounded-[12px] hover:bg-black transition-all shadow-md active:scale-95 flex items-center justify-center group"
                        >
                            <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
