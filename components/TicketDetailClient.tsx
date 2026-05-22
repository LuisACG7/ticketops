'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Send, Paperclip, CheckCircle2, RefreshCw, FileText, X, Image as ImageIcon, Star } from 'lucide-react'
import { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from '@supabase/supabase-js'
import { rateAndCloseTicket } from '@/app/dashboard/tickets/actions'

export interface ProfilerInfo {
  name: string
  avatar_url: string | null
  role: string
}

export interface Comment {
  id: string
  ticket_id: string
  user_id: string
  message: string
  attachments: string[] | null
  created_at: string
  emisor?: ProfilerInfo
}

export interface TicketStructure {
  id: string
  serial_number: number
  title: string
  description: string
  status: 'Abierto' | 'En proceso' | 'Resuelto' | 'Cerrado'
  priority: string
  category_id: number
  location: string | null
  rating?: number | null
  usuario?: ProfilerInfo
  tecnico?: ProfilerInfo
}

interface TicketDetailClientProps {
  initialTicket: TicketStructure
  initialComments: Comment[]
  currentUserId: string
}

export default function TicketDetailClient({ initialTicket, initialComments, currentUserId }: TicketDetailClientProps) {
  const supabase = createClient()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [ticket, setTicket] = useState<TicketStructure>(initialTicket)
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newMessage, setNewMessage] = useState<string>('')
  const [sending, setSending] = useState<boolean>(false)

  // Estados para el manejo de archivos adjuntos
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState<boolean>(false)

  // Estados para el sistema de calificación por estrellas
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false)

  // Sincronizar el estado local cuando cambien las props del Servidor
  useEffect(() => {
    setTicket(initialTicket)
    setComments(initialComments)
  }, [initialTicket, initialComments])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [comments])

  // Suscripción Realtime Unificada para comentarios y estado del ticket
  useEffect(() => {
    // 1. Canal para nuevos comentarios
    const commentsChannel = supabase
      .channel(`chat_room_${ticket.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'comments', 
          filter: `ticket_id=eq.${ticket.id}` 
        },
        async (payload: RealtimePostgresInsertPayload<{ id: string; ticket_id: string; user_id: string; message: string; attachments: string[] | null; created_at: string }>) => {
          const newComment = payload.new

          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('name, avatar_url, role')
              .eq('id', newComment.user_id)
              .maybeSingle()

            if (profileError || !profile) throw new Error("No profile found")

            const commentWithProfile: Comment = {
              ...newComment,
              emisor: {
                name: profile.name,
                avatar_url: profile.avatar_url,
                role: profile.role
              }
            }

            setComments((prev) => {
              if (prev.some((c) => c.id === newComment.id)) return prev
              return [...prev, commentWithProfile]
            })
          } catch {
            const fallbackComment: Comment = {
              ...newComment,
              emisor: { name: 'Soporte / Usuario', avatar_url: null, role: 'Usuario' }
            }
            setComments((prev) => {
              if (prev.some((c) => c.id === newComment.id)) return prev
              return [...prev, fallbackComment]
            })
          }
        }
      )
      .subscribe()

    // 2. Canal para escuchar actualizaciones de este ticket específico (Cambios de Estado o Rating)
    const ticketChannel = supabase
      .channel(`ticket_state_${ticket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticket.id}`
        },
        (payload: RealtimePostgresUpdatePayload<TicketStructure>) => {
          const updatedTicket = payload.new
          setTicket((prev) => ({
            ...prev,
            status: updatedTicket.status,
            rating: updatedTicket.rating
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(commentsChannel)
      supabase.removeChannel(ticketChannel)
    }
  }, [ticket.id, supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || sending) return

    setSending(true)
    const textToSend = newMessage.trim()
    setNewMessage('')

    const uploadedUrls: string[] = []

    try {
      if (selectedFile) {
        setUploadingFile(true)
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${ticket.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(fileName)

        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl)
        }
        
        setSelectedFile(null)
        setUploadingFile(false)
      }

      const { error } = await supabase
        .from('comments')
        .insert([
          {
            ticket_id: ticket.id,
            user_id: currentUserId,
            message: textToSend || (uploadedUrls.length > 0 ? "Archivo adjunto" : ""),
            attachments: uploadedUrls.length > 0 ? uploadedUrls : null
          }
        ])

      if (error) throw error
    } catch (err) {
      console.error('Error al enviar el mensaje o adjunto:', err)
      alert('Ocurrió un error al subir tu archivo o enviar el mensaje.')
    } finally {
      setSending(false)
      setUploadingFile(false)
    }
  }

  // Cambiar estado a "En proceso" si el alumno reabre la incidencia
  const handleReopenStatus = async () => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'En proceso', rating: null, updated_at: new Date().toISOString() })
        .eq('id', ticket.id)

      if (!error) {
        setTicket((prev) => ({ ...prev, status: 'En proceso', rating: null }))
        setRating(0)
      }
    } catch (err) {
      console.error('Error al reabrir ticket:', err)
    }
  }

  // Manejar el envío de la evaluación de estrellas
  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert("Por favor selecciona una estrella antes de enviar.");
      return;
    }
    setIsSubmittingRating(true)
    const res = await rateAndCloseTicket(ticket.id, rating)
    setIsSubmittingRating(false)
    
    if (res.error) {
      alert(res.error)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Abierto': 'bg-blue-50 text-blue-600 border-blue-100',
      'En proceso': 'bg-amber-50 text-amber-600 border-amber-200/60',
      'Resuelto': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      'Cerrado': 'bg-gray-100 text-gray-500 border-gray-200',
    }
    return styles[status] || styles['Abierto']
  }

  const isImageFile = (url: string) => {
    const cleanUrl = url.split('?')[0].toLowerCase()
    return cleanUrl.endsWith('.png') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.gif') || cleanUrl.endsWith('.webp')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
      
      {/* PANEL LATERAL: INFORMACIÓN DEL TICKET */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ticket Folio</span>
              <h2 className="text-base font-extrabold text-gray-900">#REQ-2026-{ticket.serial_number || ticket.id.substring(0,4).toUpperCase()}</h2>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-3 rounded-xl border border-gray-100">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</h4>
              <p className="text-xs font-bold text-gray-800 mt-0.5">{ticket.category_id === 4 ? 'Cuentas y Accesos' : 'Soporte Técnico'}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority</h4>
              <p className="text-xs font-bold text-gray-800 mt-0.5 flex items-center gap-1">
                <span>⚠️</span> {ticket.priority}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Assigned Technician</h4>
            {ticket.tecnico ? (
              <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#0b3b60] text-white flex items-center justify-center font-bold text-xs uppercase">
                  {ticket.tecnico.name.substring(0,2)}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{ticket.tecnico.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Coordinación de Cómputo</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Asignación pendiente por Admin...</p>
            )}
          </div>
        </div>

        {/* STATUS HISTORY CON INTERFAZ DE EVALUACIÓN */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Status History</h3>
          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            <div className="flex gap-3 relative">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 text-white ${ticket.status === 'Resuelto' || ticket.status === 'Cerrado' ? 'bg-emerald-500' : 'bg-[#0b3b60]'}`}>
                <CheckCircle2 size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 font-sans">Resolución del Caso</p>
                <p className="text-[10px] text-gray-400">Estado actual de la incidencia: <span className="font-bold">{ticket.status}</span></p>
              </div>
            </div>
          </div>

          {/* VISTA 1: El técnico resolvió, el alumno procede a calificar para cerrar */}
          {ticket.status === 'Resuelto' && (
            <div className="pt-3 border-t border-gray-100 space-y-3 animate-fadeIn">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-emerald-800">¿Se solucionó tu problema?</p>
                <p className="text-[11px] text-emerald-600/90 mt-0.5">Evalúa el servicio recibido para cerrar el caso.</p>
                
                {/* Estrellas Interactivas */}
                <div className="flex justify-center items-center gap-1.5 my-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={22}
                        className={`${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitRating}
                disabled={rating === 0 || isSubmittingRating}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {isSubmittingRating ? 'Guardando...' : 'Marcar como Satisfecho y Cerrar'}
              </button>
              
              <button
                type="button"
                onClick={handleReopenStatus}
                className="w-full flex items-center justify-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold py-2 px-4 rounded-xl transition-all"
              >
                <RefreshCw size={12} /> Reabrir Ticket (Persiste error)
              </button>
            </div>
          )}

          {/* VISTA 2: El ticket ya se encuentra Cerrado y calificado */}
          {ticket.status === 'Cerrado' && (
            <div className="pt-2 border-t border-gray-100 text-center space-y-2 animate-fadeIn">
              <p className="text-xs font-bold text-gray-500">Incidencia Finalizada</p>
              {ticket.rating && (
                <div className="flex justify-center items-center gap-1 bg-gray-50 py-1.5 px-3 rounded-lg w-max mx-auto border border-gray-100">
                  <span className="text-[11px] font-bold text-gray-600 mr-1">Tu evaluación:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={`${star <= (ticket.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PANEL DE RESPUESTAS / MENSAJERÍA */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/90 shadow-sm min-h-[550px] h-[70vh] flex flex-col overflow-hidden w-full">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              💬
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Support Thread</h3>
              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                Canal Activo en Tiempo Real
              </p>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30 flex flex-col justify-start">
          {comments.length === 0 ? (
            <div className="my-auto flex flex-col items-center justify-center text-center p-6">
              <p className="text-xs font-bold text-gray-400">Sin historial de comentarios</p>
              <p className="text-[11px] text-gray-400/80 mt-1">Envía un mensaje abajo para iniciar la conversación.</p>
            </div>
          ) : (
            comments.map((msg) => {
              const isMe = msg.user_id === currentUserId
              return (
                <div key={msg.id} className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-bold text-gray-400 mb-1 px-1">
                    {isMe ? 'Tú' : msg.emisor?.name || 'Soporte'}
                  </span>
                  <div className={`max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed font-medium shadow-sm ${
                    isMe 
                      ? 'bg-[#0b3b60] text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}>
                    <p className="break-words whitespace-pre-wrap">{msg.message}</p>
                    
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/20 space-y-1.5">
                        {msg.attachments.map((url, index) => (
                          <div key={index} className="rounded-lg overflow-hidden">
                            {isImageFile(url) ? (
                              <a href={url} target="_blank" rel="noreferrer" className="block group relative">
                                <img 
                                  src={url} 
                                  alt="Adjunto" 
                                  className="max-h-48 rounded-lg object-cover border border-black/10 hover:opacity-95 transition-all"
                                />
                              </a>
                            ) : (
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className={`flex items-center gap-2 p-2 rounded-xl text-[11px] border transition-all ${
                                  isMe 
                                    ? 'bg-black/10 border-white/10 text-white hover:bg-black/20' 
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <FileText size={14} className={isMe ? 'text-blue-200' : 'text-gray-500'} />
                                <span className="underline truncate max-w-[180px]">Ver archivo adjunto (PDF)</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <span className={`block text-[9px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Barra de previsualización de archivos */}
        {selectedFile && (
          <div className="px-4 py-2 bg-blue-50/80 border-t border-blue-100 flex items-center justify-between text-xs font-semibold text-blue-700 animate-fadeIn">
            <div className="flex items-center gap-2 truncate">
              {selectedFile.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
              <span className="truncate max-w-[250px]">{selectedFile.name}</span>
              <span className="text-[10px] text-blue-400 font-normal">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button 
              type="button" 
              onClick={handleRemoveFile}
              className="p-1 text-blue-400 hover:text-blue-600 rounded-full hover:bg-blue-100/50 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 bg-white flex items-center gap-2 mt-auto">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            className="hidden"
            disabled={ticket.status === 'Cerrado' || uploadingFile}
          />

          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={ticket.status === 'Cerrado' || uploadingFile}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
          >
            <Paperclip size={16} className={selectedFile ? 'text-blue-600' : ''} />
          </button>
          
          <input 
            type="text"
            placeholder={uploadingFile ? "Subiendo archivo..." : ticket.status === 'Cerrado' ? "Esta incidencia se encuentra cerrada" : "Escribe tu respuesta aquí..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={ticket.status === 'Cerrado' || uploadingFile}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-800 placeholder-gray-400 disabled:opacity-60"
          />

          <button 
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || sending || ticket.status === 'Cerrado' || uploadingFile}
            className="p-2 bg-[#0b3b60] text-white rounded-xl hover:bg-opacity-90 disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-sm flex items-center justify-center"
          >
            <Send size={14} />
          </button>
        </form>

      </div>
    </div>
  )
}