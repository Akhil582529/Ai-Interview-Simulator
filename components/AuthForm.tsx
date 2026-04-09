"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { toast } from "sonner"
import CustomFormField from "./CustomFormField"

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase/client"
import { useRouter } from "next/navigation"
import React from "react"
import { signUp, signIn } from "@/lib/actions/auth.action"

type FormType = "sign-in" | "sign-up"

const AuthFormSchema = (type: FormType) => {
  return z.object({
    name:
      type === "sign-up"
        ? z.string().min(3, "Name must be at least 3 characters")
        : z.string().optional(),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
}

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter()
  const formSchema = AuthFormSchema(type)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  const isSignIn = type === "sign-in"

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { name, email, password } = values

      if (type === "sign-up") {
      
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)

        const result = await signUp({
          uid: userCredential.user.uid,
          name: name,
          email,
        })

        if (!result?.success) {
          toast.error(result?.message)
          return
        }

        toast.success("Account created successfully! Please sign in.")
        router.push("/sign-in")
      } else {
        // ✅ Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        const idToken = await userCredential.user.getIdToken()

        if (!idToken) {
          toast.error("Sign in failed. Please try again.")
          return
        }

        // ✅ Optional: send token to backend for session handling
        await signIn({
          email,
          idToken,
        })

        toast.success("Signed in successfully!")
        router.push("/") // 👈 change to your post-login route
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "There was an error. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl bg-card text-card-foreground shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isSignIn ? "Sign In" : "Create an Account"}
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!isSignIn && (
              <CustomFormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your name"
              />
            )}

            <CustomFormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="you@example.com"
              type="email"
            />

            <CustomFormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="••••••••"
              type="password"
            />

            <Button type="submit" className="w-full h-12 text-lg">
              {isSignIn ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </Form>

        <p className="text-center mt-6 text-muted-foreground">
          {isSignIn ? "Don’t have an account?" : "Already have an account?"}
          <a
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold ml-1 text-primary hover:underline"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </a>
        </p>
      </div>
    </div>
  )
}

export default AuthForm
