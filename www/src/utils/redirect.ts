export function redirect(href: string): Response {
  return new Response('', {
    status: 302,
    headers: {
      Location: href,
    },
  });
}
