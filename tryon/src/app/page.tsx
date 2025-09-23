import Image from "next/image";
import SignIn from "../components/sign-in";
import SignOut from "../components/sign-out";
import { auth } from "../../auth";
import UploadBtn from "../components/upload";

export default async function Home() {
  const session = await auth()
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1>TryOn</h1>
      <h3> Hi {session?.user?.name}</h3>
      {session && <Image src={session?.user?.image || ""} alt="User Image" width={100} height={100} />}
      {session ?  <SignOut /> : <SignIn />}
      <UploadBtn/>
    </div>
  );
}
