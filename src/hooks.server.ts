export const handle = async ({ event, resolve }) => {
  if (event.url.pathname.includes('.well-known')) {
    return new Response(null, { status: 200 });
  }
  return await resolve(event);
};