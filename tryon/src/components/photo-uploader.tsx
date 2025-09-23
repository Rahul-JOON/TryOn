"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { UploadDropzone } from "../app/utils/uploadthing"
import { toast } from "sonner"

const profileTypes = [
	{ value: "front", label: "Front" },
	{ value: "left", label: "Left" },
	{ value: "right", label: "Right" },
	{ value: "back", label: "Back" },
]

interface UploadResult {
	fileUrl: string
	profileType: string
}

async function createUserPhotoRecord(data: UploadResult): Promise<{ userPhotoId: number }> {
	const response = await fetch('/api/user-photos/create', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})

	if (!response.ok) {
		const error = await response.json()
		throw new Error(error.error || 'Failed to create photo record')
	}

	return response.json()
}

async function rollbackUploadedFile(fileUrl: string): Promise<void> {
	try {
		await fetch('/api/user-photos/rollback', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fileUrl }),
		})
	} catch (error) {
		console.error('Rollback failed:', error)
	}
}

export default function PhotoUploader() {
	const router = useRouter()
	const [profileType, setProfileType] = useState<string>("front")
	const [isProcessing, setIsProcessing] = useState(false)

	const handleUploadComplete = async (result: UploadResult) => {
		setIsProcessing(true)

		try {
			await createUserPhotoRecord(result)
			toast.success('Photo uploaded successfully')
			router.refresh()
		} catch (error) {
			console.error('Photo creation failed:', error)
			await rollbackUploadedFile(result.fileUrl)
			toast.error(error instanceof Error ? error.message : 'Upload failed')
		} finally {
			setIsProcessing(false)
		}
	}

	return (
		<div className="mx-auto w-full max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-lg backdrop-blur">
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-zinc-100">Upload your profile photo</h2>
					<p className="text-sm text-zinc-400">Drag and drop an image, then choose a profile type.</p>
				</div>
				<label className="flex items-center gap-2 text-sm text-zinc-300">
					<span>Profile type</span>
					<select
						value={profileType}
						onChange={(e) => setProfileType(e.target.value)}
						className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600"
						disabled={isProcessing}
					>
						{profileTypes.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</label>
			</div>

			{isProcessing && (
				<div className="mb-4 rounded-lg bg-blue-900/20 border border-blue-800 p-3">
					<div className="flex items-center gap-2 text-blue-300">
						<div className="animate-spin w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full"></div>
						<span className="text-sm">Saving photo record...</span>
					</div>
				</div>
			)}

			<UploadDropzone
				endpoint="imageUploader"
				disabled={isProcessing}
				appearance={{
					button: "ut-ready:bg-zinc-800 ut-ready:hover:bg-zinc-700 ut-uploading:bg-zinc-800",
					container: "bg-zinc-900/40 border-zinc-800 text-zinc-300",
					uploadIcon: "text-zinc-200",
					label: "text-zinc-300",
				}}
				onClientUploadComplete={async (res) => {
					if (!res?.[0]) return
					console.log('Upload response:', res[0]) // Debug log
					console.log('Server data:', res[0].serverData) // Debug server data
					await handleUploadComplete({
						fileUrl: res[0].ufsUrl || res[0].url,
						profileType: profileType,
					})
				}}
				onUploadError={(error: Error) => {
					toast.error(`Upload failed: ${error.message}`)
				}}
			/>
		</div>
	)
}