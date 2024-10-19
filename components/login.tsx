"use client";

import { signIn, useSession } from "next-auth/react";

export default function Login() {
    const { data: session, status } = useSession();

    if (session) {
        return <div>Welcome {session.user?.name}</div>;
    }

    return(
        <div>
            <button onClick={() => signIn()}>Login</button>
        </div>
    )
}
