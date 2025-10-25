import { Controller, Get, Param, Req, Res } from "@nestjs/common";
import { Public } from "@xidoke/auth";
import type { Request, Response } from "express";
import { RedirectService } from "./redirect.service";

/**
 * Redirect Controller
 * Handles short URL redirects (performance critical)
 */
@Controller()
export class RedirectController {
	constructor(private readonly redirectService: RedirectService) {}

	/**
	 * Redirect short code to long URL
	 * This is the most critical endpoint - must be fast!
	 * Public endpoint - no authentication required
	 */
	@Get(":shortCode")
	@Public()
	async redirect(
		@Param("shortCode") shortCode: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		const startTime = Date.now();

		try {
			// Resolve short code to long URL
			const { longUrl, linkId } =
				await this.redirectService.resolveShortCode(shortCode);

			// Track click asynchronously (fire-and-forget)
			this.redirectService
				.trackClick(linkId, {
					ipAddress: req.ip || "unknown",
					userAgent: req.headers["user-agent"],
					referer: req.headers.referer,
				})
				.catch((err) => {
					// Log error but don't block redirect
					console.error("Click tracking failed:", err);
				});

			// Log performance
			const latency = Date.now() - startTime;
			if (latency > 100) {
				console.warn(`Slow redirect: ${latency}ms for ${shortCode}`);
			}

			// 302 redirect (temporary - allows tracking)
			return res.redirect(302, longUrl);
		} catch (error: unknown) {
			// Type guard for errors with status property
			const hasStatus = (
				err: unknown,
			): err is { status: number; message?: string } => {
				return typeof err === "object" && err !== null && "status" in err;
			};

			// For 404s, return a user-friendly page
			if (hasStatus(error) && error.status === 404) {
				return res.status(404).json({
					error: "Link not found",
					message: "This short link does not exist or has been deleted",
				});
			}

			// For expired/disabled links
			if (hasStatus(error) && error.status === 410) {
				return res.status(410).json({
					error: "Link unavailable",
					message: error.message || "Link is no longer available",
				});
			}

			// Generic error
			return res.status(500).json({
				error: "Internal server error",
				message: "An error occurred while processing your request",
			});
		}
	}
}
