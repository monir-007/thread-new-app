import AccountProfile from "@/components/forms/AccountProfile";
import {currentUser} from "@clerk/nextjs";

async function Page() {
    const user = await currentUser();
    // const userInfo = await fetchUser(user.id);
    const userInfo = {};
    const userData = {
        // id: user?.id,
        // objectId: userInfo?._id,
        // username: userInfo ? userInfo?.username : user.username,
        // name: userInfo ? userInfo?.name : user.firstName ?? "",
        // bio: userInfo ? userInfo?.bio : "",
        // image: userInfo ? userInfo?.image : user.imageUrl,
        id: user?.id,
        objectId: userInfo?._id,
        username: userInfo?.username || user?.username,
        name: userInfo?.name || user?.firstName || "",
        bio: userInfo?.bio || "",
        image: userInfo?.image || user?.imageUrl,
    }
    return (
        <main className="mx-auto flex max-w-3xl flex-col">
            <h1 className='head-text'>Onboarding</h1>
            <p className='mt-3 text-base-regular text-light-2'>
                Complete your profile now, to use Threads.
            </p>

            <section className="mt-9 bg-dark-2 p-10">
                <AccountProfile user={userData} btnTitle='Continue'/>
            </section>
        </main>
    )
}

export default Page;
