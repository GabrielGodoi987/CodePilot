export class HealthCheckController {
  // receives request, response and next as paramters in this method
  public static async getHealthCheck() {
    return "example";
  }
}
