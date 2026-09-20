import * as React from 'react'

import { Input } from '@/components/ui/input'
import { formatKurusInput, parseKurus } from '@/lib/money'

interface MoneyInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type' | 'inputMode'
> {
  value: string
  onChange: (value: string) => void
}

function countDigits(text: string): number {
  return text.replace(/\D/g, '').length
}

function positionAfterDigit(
  text: string,
  digitCount: number,
  side: 'before' | 'after' = 'before',
): number {
  if (digitCount <= 0) return 0
  const commaIndex = text.indexOf(',')
  let seen = 0
  for (let i = 0; i < text.length; i++) {
    if (/\d/.test(text[i])) {
      seen++
      if (seen === digitCount) {
        const posBeforeComma = i + 1
        const isLastIntegerDigitButWantsAfterComma =
          side === 'after' && posBeforeComma === commaIndex
        return isLastIntegerDigitButWantsAfterComma ? commaIndex + 1 : posBeforeComma
      }
    }
  }
  return text.length
}

export function MoneyInput({
  value,
  onFocus,
  onKeyDown,
  onPaste,
  onChange,
  ref,
  ...props
}: MoneyInputProps) {
  const innerRef = React.useRef<HTMLInputElement>(null)
  const targetDigitIndexRef = React.useRef<number | null>(null)
  const targetSideRef = React.useRef<'before' | 'after'>('before')
  const displayValue = value === '' ? formatKurusInput(0) : value
  const currentKurus = Number(displayValue.replace(/\D/g, '')) || 0

  React.useLayoutEffect(() => {
    const el = innerRef.current
    const targetDigitIndex = targetDigitIndexRef.current
    const side = targetSideRef.current
    targetDigitIndexRef.current = null
    targetSideRef.current = 'before'
    if (el && document.activeElement === el && targetDigitIndex !== null) {
      const pos = positionAfterDigit(displayValue, targetDigitIndex, side)
      el.setSelectionRange(pos, pos)
    }
  }, [displayValue])

  function moveCursorSynchronously(
    input: HTMLInputElement,
    targetDigitIndex: number,
    side: 'before' | 'after',
  ) {
    const pos = positionAfterDigit(displayValue, targetDigitIndex, side)
    input.setSelectionRange(pos, pos)
  }

  function apply(
    input: HTMLInputElement,
    nextKurusRaw: number,
    targetDigitIndex: number,
    side: 'before' | 'after' = 'before',
  ) {
    const nextKurus = Math.max(0, nextKurusRaw)
    const valueIsUnchanged = nextKurus === currentKurus
    if (valueIsUnchanged) {
      moveCursorSynchronously(input, targetDigitIndex, side)
      return
    }
    targetDigitIndexRef.current = targetDigitIndex
    targetSideRef.current = side
    onChange(formatKurusInput(nextKurus))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(e)
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return

    const input = e.currentTarget
    const pos = input.selectionStart ?? displayValue.length
    const commaIndex = displayValue.indexOf(',')
    const flat = displayValue.replace(/\D/g, '')
    const pureIndex = countDigits(displayValue.slice(0, pos))
    const inIntegerZone = pos <= commaIndex
    const intPart = flat.slice(0, flat.length - 2)

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      if (inIntegerZone) {
        if (pureIndex === 0) return
        const newFlat = flat.slice(0, pureIndex - 1) + flat.slice(pureIndex)
        apply(input, Number(newFlat) || 0, pureIndex - 1)
        return
      }
      const cursorImmediatelyAfterComma = pureIndex === flat.length - 2
      if (cursorImmediatelyAfterComma) {
        input.setSelectionRange(commaIndex, commaIndex)
        return
      }
      const newFlat = flat.slice(0, pureIndex - 1) + '0' + flat.slice(pureIndex)
      apply(input, Number(newFlat) || 0, pureIndex - 1, 'after')
      return
    }

    if (e.key.length !== 1) return
    e.preventDefault()
    if (!/^[0-9]$/.test(e.key)) return

    if (inIntegerZone) {
      const integerPartIsPlaceholderZero = intPart === '0'
      if (integerPartIsPlaceholderZero) {
        apply(input, Number(e.key + flat.slice(flat.length - 2)) || 0, 1)
        return
      }
      const newFlat = flat.slice(0, pureIndex) + e.key + flat.slice(pureIndex)
      apply(input, Number(newFlat) || 0, pureIndex + 1)
      return
    }
    const cursorAtEndOfKurusPart = pureIndex >= flat.length
    if (cursorAtEndOfKurusPart) return
    const newFlat = flat.slice(0, pureIndex) + e.key + flat.slice(pureIndex + 1)
    apply(input, Number(newFlat) || 0, pureIndex + 1)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    onPaste?.(e)
    if (e.defaultPrevented) return
    e.preventDefault()
    const nextKurus = Math.max(0, parseKurus(e.clipboardData.getData('text')))
    apply(e.currentTarget, nextKurus, countDigits(formatKurusInput(nextKurus)))
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    onFocus?.(e)
    e.target.select()
  }

  return (
    <Input
      {...props}
      ref={(node) => {
        innerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={() => {}}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={handleFocus}
    />
  )
}
