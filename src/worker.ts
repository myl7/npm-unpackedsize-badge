export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  //
  // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
  // MY_QUEUE: Queue;

  ALLOWED_PKGS: string
}

interface NpmMeta {
  dist?: {
    unpackedSize?: number
  }
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    const pkg = url.pathname.split('/')[1]
    if (!pkg) {
      return new Response('Requires package', { status: 400 })
    }

    const allowedPkgs = env.ALLOWED_PKGS.split(' ').filter(Boolean)
    if (!allowedPkgs.includes(pkg)) {
      return new Response('Not allowed package', { status: 403 })
    }

    const npmReq = await fetch(`https://registry.npmjs.org/${pkg}/latest`)
    if (npmReq.status != 200) {
      return new Response('NPM API failed', { status: 500 })
    }

    const npmMeta: NpmMeta = await npmReq.json()
    const unpackedSize = npmMeta.dist?.unpackedSize
    if (!(unpackedSize && typeof unpackedSize == 'number')) {
      return new Response('NPM API returns unexpected metadata', { status: 500 })
    }

    const unpackedSizeFormatted = `${Math.round(unpackedSize / 1000)}kB`
    const badgeMeta = {
      schemaVersion: 1,
      label: 'unpacked size',
      message: unpackedSizeFormatted,
    }
    return new Response(JSON.stringify(badgeMeta), {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    })
  },
}
