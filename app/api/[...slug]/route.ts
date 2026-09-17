import { NextRequest } from "next/server";
import { Readable } from "stream";
import app from "../../../server";

export const dynamic = "force-dynamic";

async function handleExpress(req: NextRequest): Promise<Response> {
  return new Promise<Response>(async (resolve) => {
    try {
      const url = new URL(req.url);
      const arrayBuf = await req.arrayBuffer().catch(() => null);
      const bodyBuffer = arrayBuf && arrayBuf.byteLength > 0 ? Buffer.from(arrayBuf) : undefined;

      const reqStream: any = new Readable();
      reqStream._read = () => {};
      if (bodyBuffer && bodyBuffer.length > 0) {
        reqStream.push(bodyBuffer);
      }
      reqStream.push(null);

      reqStream.url = url.pathname + url.search;
      reqStream.method = req.method;
      reqStream.headers = Object.fromEntries(req.headers.entries());
      reqStream.rawHeaders = [];
      for (const [k, v] of req.headers.entries()) {
        reqStream.rawHeaders.push(k, v);
      }
      reqStream.connection = { remoteAddress: "127.0.0.1" };
      reqStream.socket = { remoteAddress: "127.0.0.1" };

      const responseHeaders = new Headers();
      const chunks: Buffer[] = [];
      let statusCode = 200;
      let statusMessage = "OK";
      let isResolved = false;

      const resMock: any = {
        statusCode: 200,
        statusMessage: "OK",
        headersSent: false,
        setHeader(name: string, value: any) {
          if (Array.isArray(value)) {
            responseHeaders.delete(name);
            value.forEach((v) => responseHeaders.append(name, String(v)));
          } else {
            responseHeaders.set(name, String(value));
          }
          return this;
        },
        getHeader(name: string) {
          return responseHeaders.get(name);
        },
        getHeaders() {
          return Object.fromEntries(responseHeaders.entries());
        },
        hasHeader(name: string) {
          return responseHeaders.has(name);
        },
        removeHeader(name: string) {
          responseHeaders.delete(name);
        },
        status(code: number) {
          this.statusCode = code;
          statusCode = code;
          return this;
        },
        writeHead(code: number, headersOrMsg?: any, headers?: any) {
          this.statusCode = code;
          statusCode = code;
          if (typeof headersOrMsg === "object") {
            for (const [k, v] of Object.entries(headersOrMsg)) {
              this.setHeader(k, v);
            }
          }
          if (headers && typeof headers === "object") {
            for (const [k, v] of Object.entries(headers)) {
              this.setHeader(k, v);
            }
          }
          return this;
        },
        write(chunk: any) {
          if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          return true;
        },
        end(chunk?: any) {
          if (isResolved) return;
          isResolved = true;
          this.headersSent = true;
          if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const fullBody = Buffer.concat(chunks);
          resolve(
            new Response(fullBody, {
              status: statusCode,
              statusText: statusMessage,
              headers: responseHeaders,
            })
          );
        },
        send(data: any) {
          if (typeof data === "object" && !Buffer.isBuffer(data)) {
            this.setHeader("Content-Type", "application/json; charset=utf-8");
            this.end(JSON.stringify(data));
          } else {
            this.end(data);
          }
        },
        json(data: any) {
          this.setHeader("Content-Type", "application/json; charset=utf-8");
          this.end(JSON.stringify(data));
        },
        redirect(urlOrStatus: any, urlTarget?: string) {
          const status = typeof urlOrStatus === "number" ? urlOrStatus : 302;
          const target = typeof urlOrStatus === "string" ? urlOrStatus : urlTarget || "/";
          this.statusCode = status;
          this.setHeader("Location", target);
          this.end();
        },
      };

      app(reqStream, resMock);
    } catch (err: any) {
      resolve(
        new Response(JSON.stringify({ ok: false, error: err?.message || "Internal Server Error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
  });
}

export async function GET(req: NextRequest) {
  return handleExpress(req);
}

export async function POST(req: NextRequest) {
  return handleExpress(req);
}

export async function PUT(req: NextRequest) {
  return handleExpress(req);
}

export async function DELETE(req: NextRequest) {
  return handleExpress(req);
}

export async function PATCH(req: NextRequest) {
  return handleExpress(req);
}

export async function OPTIONS(req: NextRequest) {
  return handleExpress(req);
}

export async function HEAD(req: NextRequest) {
  return handleExpress(req);
}
