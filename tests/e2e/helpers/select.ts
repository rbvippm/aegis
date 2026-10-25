import type { Locator, Page } from '@playwright/test'
export async function chooseOption(
  page: Page,
  control: Locator,
  option: string | { label: string },
) {
  const label =
    typeof option === 'string'
      ? await control.evaluate(
          (el, value) =>
            Array.from(el.parentElement!.querySelector('select')!.options)
              .find((item) => item.value === value)
              ?.text.trim(),
          option,
        )
      : option.label
  if (!label) throw new Error(`Missing option ${JSON.stringify(option)}`)
  await control.click()
  await page.getByRole('option', { name: label, exact: true }).click()
}
