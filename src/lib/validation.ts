import { z } from 'zod'

// Keep in sync with DynamicWebsite.Core.Constants.ValidationRegex
export const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
export const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/

export const emailField = (label = 'Email') =>
  z.string().trim().min(1, `${label} is required`).regex(EMAIL_REGEX, `Enter a valid ${label.toLowerCase()}`)

export const phoneField = (label = 'Phone number') =>
  z.string().trim().min(1, `${label} is required`).regex(PHONE_REGEX, 'Use digits only, e.g. +971501234567')

/** For <input type="number"> registered with setValueAs: blank -> undefined */
export const toNumber = (v: unknown) => (v === '' || v === null || v === undefined ? undefined : Number(v))

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'
