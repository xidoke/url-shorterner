import { Controller, Get } from "@nestjs/common";
import { UsersService } from "./users.service";

/**
 * Users Controller
 * Handles user-related operations
 */
@Controller("api/v1/users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	/**
	 * Get current user profile
	 */
	@Get("me")
	async getProfile() {
		// TODO: Get user from request context
		const userId = 1n; // Placeholder
		return this.usersService.findById(userId);
	}
}
