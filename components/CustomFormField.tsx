"use client"

import { Controller, Control, FieldValues, Path } from "react-hook-form"

import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface CustomFormFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  type?: "text" | "email" | "password"
}

const CustomFormField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
}: CustomFormFieldProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
              className="h-12 w-full"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default CustomFormField
