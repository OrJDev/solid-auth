import { ActionButton, ButtonGroup, Description, Title } from "~/components";

export default function HomePage() {
  return (
    <>
      <Title>Solid Auth</Title>
      <Description>
        Solid auth is a library that allows you to easily add authentication to
        your SolidStart application with a few lines of code.
      </Description>

      <main class="flex h-full flex-1 flex-col items-center space-y-8 py-32 md:space-y-12 md:py-40 lg:justify-center lg:space-y-16">
        <h1 class="flex items-center text-2xl font-medium text-slate-900 dark:text-slate-200 md:text-[28px] lg:text-4xl">
          Solid Auth
        </h1>
        <p class="px-4 text-center text-lg md:text-xl lg:text-3xl">
          Authentication for SolidStart.
        </p>
        <ButtonGroup class="justify-center">
          <ActionButton
            variant="primary"
            label="Get started"
            type="link"
            href="/guides"
          />
          <ActionButton
            variant="secondary"
            label="API reference"
            type="link"
            href="/api"
          />
        </ButtonGroup>
      </main>
    </>
  );
}
