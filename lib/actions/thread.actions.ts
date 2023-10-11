"use server";

import {revalidatePath} from "next/cache";
import {connectToDB} from "@/lib/mongoose";
import Thread from "@/lib/models/thread.model";
import User from "@/lib/models/user.model";
import Community from "@/lib/models/community.model";

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
    await connectToDB();
    // Calculate the number of posts to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // create a query to fetch the posts that have no parent (top-level threads) (a thread that is not a comment/reply)
    const postsQuery = Thread
        .find({parentId: {$in: [null, undefined]}})
        .sort({createdAt: "desc"})
        .skip(skipAmount)
        .limit(pageSize)
        .populate({
            path: "author",
            model: User
        })
        .populate({
            path: "community",
            model: Community,
        })
        .populate({
            path: "children", // Populate the children field
            populate: {
                path: "author",  // Populate the author field within children
                model: User,
                select: "_id name parentId image", // Select only _id and username fields of the author
            }
        });
    // Count the total number of top-level posts (threads) i.e., threads that are not comments.
    const totalPostsCount = await Thread.countDocuments({
        parentId: {$in: [null, undefined]},
    }); // get the total count of posts

    const posts = await postsQuery.exec();
    const isNext = totalPostsCount > skipAmount + posts.length;
    return {posts, isNext};
}

interface Params {
    text: string,
    author: string,
    communityId: string | null,
    path: string,
}

export async function createThread({text, author, communityId, path}: Params) {
    try {
        await connectToDB();

        const communityIdObject = await Community.findOne(
            {id: communityId},
            {_id: 1}
        );
        const createdThread = await Thread.create({
            text,
            author,
            community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
        });

        // update User model
        await User.findByIdAndUpdate(author, {
            $push: {threads: createdThread._id}
        })
        if (communityIdObject) {
            // Update Community model
            await Community.findByIdAndUpdate(communityIdObject, {
                $push: {threads: createdThread._id}
            });
        }
        revalidatePath(path);

    } catch (error: any) {
        throw new Error(`Failed to create thread: ${error.message}`);
    }
}

export async function fetchThreadById(threadId: string) {
    await connectToDB();
    try {
        const thread = await Thread.findById(threadId)
            .populate({
                path: "author",
                model: User,
                select: "_id id name image",
            }) // Populate the author field with _id and username
            .populate({
                path: "community",
                model: Community,
                select: "_id id name image",
            }) // Populate the community field with _id and name
            .populate({
                path: "children", // Populate the children field
                populate: [
                    {
                        path: "author", // Populate the author field within children
                        model: User,
                        select: "_id id name parentId image", // Select only _id and username fields of the author
                    },
                    {
                        path: "children", // Populate the children field within children
                        model: Thread, // The model of the nested children (assuming it's the same "Thread" model)
                        populate: {
                            path: "author", // Populate the author field within nested children
                            model: User,
                            select: "_id id name parentId image", // Select only _id and username fields of the author
                        },
                    },
                ],
            })
            .exec();

        return thread;
    } catch (error) {
        console.error("Error while fetching thread:", error);
        throw new Error("Unable to fetch thread");
    }
}
