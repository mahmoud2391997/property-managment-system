import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Download, FileText } from "lucide-react"
import { ReactNode } from "react"

interface Attachment {
  name: string
  size: string
}

interface TicketCommentProps {
  avatarSrc?: string
  avatarFallback: string
  authorName: string
  /** Color variant for the author name */
  authorVariant?: "tenant" | "staff"
  timestamp: string
  children: ReactNode
  attachment?: Attachment
}

export function TicketComment({
  avatarSrc,
  avatarFallback,
  authorName,
  authorVariant = "staff",
  timestamp,
  children,
  attachment,
}: TicketCommentProps) {
  return (
    <div className="flex gap-4">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={avatarSrc} />
        <AvatarFallback className="bg-gray-200 text-gray-600">{avatarFallback}</AvatarFallback>
      </Avatar>
      <div className="flex-1 rounded-lg bg-gray-100 p-4">
        <div className="mb-3 flex items-baseline gap-2">
          <span
            className={`text-sm font-semibold ${
              authorVariant === "tenant" ? "text-orange-500" : "text-gray-900"
            }`}
          >
            {authorName}
          </span>
          <span className="text-sm text-gray-500">{timestamp}</span>
        </div>

        <div className="text-sm leading-relaxed text-gray-700">{children}</div>

        {attachment && (
          <div className="mt-4 flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{attachment.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{attachment.size}</span>
              <Download className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}