"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import Image from "next/image"

interface Photo {
	id: number
	photoUrl: string
	profiletype: string | null
	uploadedAt: Date
}

interface PhotoGridProps {
	photos: Photo[]
	userId?: string
}

async function deletePhoto(photoId: number): Promise<void> {
	const response = await fetch('/api/user-photos/delete', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ photoId }),
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.error || 'Failed to delete photo')
	}
}

export default function PhotoGrid({ photos, userId }: PhotoGridProps) {
	const router = useRouter()
	const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

	const handleDelete = async (photoId: number) => {
		if (deletingIds.has(photoId)) return

		setDeletingIds(prev => new Set(prev).add(photoId))

		try {
			await deletePhoto(photoId)
			toast.success('Photo deleted successfully')
			router.refresh()
		} catch (error) {
			console.error('Delete failed:', error)
			toast.error(error instanceof Error ? error.message : 'Delete failed')
		} finally {
			setDeletingIds(prev => {
				const newSet = new Set(prev)
				newSet.delete(photoId)
				return newSet
			})
		}
	}

	if (!userId) {
		return (
			<p className="text-sm text-zinc-400">Please sign in to view and upload your photos.</p>
		)
	}

	if (photos.length === 0) {
		return (
			<p className="text-sm text-zinc-400">No photos yet. Upload one above.</p>
		)
	}

	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{photos.map((photo) => (
				<div key={photo.id} className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
					<div className="aspect-square overflow-hidden relative">
						<Image
							src={photo.photoUrl}
							alt={photo.profiletype ?? "user photo"}
							fill
							className="object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					</div>
					<div className="flex items-center justify-between px-2 py-2 text-xs text-zinc-300">
						<span className="capitalize text-zinc-400">{photo.profiletype ?? "unknown"}</span>
						<time className="text-zinc-500" dateTime={photo.uploadedAt.toISOString()}>
							{new Date(photo.uploadedAt).toLocaleDateString('en-US', {
								month: 'numeric',
								day: 'numeric',
								year: 'numeric'
							})}
						</time>
					</div>
					<button
						onClick={() => handleDelete(photo.id)}
						disabled={deletingIds.has(photo.id)}
						className="absolute bottom-10 cursor-pointer right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600/80 text-white opacity-0 backdrop-blur transition-opacity hover:bg-red-600 group-hover:opacity-100 disabled:opacity-50"
						title="Delete photo"
					>
						{deletingIds.has(photo.id) ? (
							<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
						) : (
							<Trash2 size={14} />
						)}
					</button>
				</div>
			))}
		</div>
	)
}