import { auth } from "../../../auth"
import { prisma } from "../../../prisma"
import PhotoUploader from "../../components/photo-uploader"
import PhotoGrid from "../../components/photo-grid"

export default async function Upload() {
	const session = await auth()
	const userId = session?.user?.id

	let photos: { id: number; photoUrl: string; profiletype: string | null; uploadedAt: Date }[] = []
	if (userId) {
		photos = await prisma.userPhoto.findMany({
			where: { userId },
			orderBy: { uploadedAt: "desc" },
		})
	}

	return (
		<div className="mx-auto max-w-6xl space-y-8 p-6">
			<PhotoUploader />

			<div>
				<h3 className="mb-4 text-lg font-semibold text-zinc-100">Your photos</h3>
				<PhotoGrid photos={photos} userId={userId} />
			</div>
		</div>
	)
}