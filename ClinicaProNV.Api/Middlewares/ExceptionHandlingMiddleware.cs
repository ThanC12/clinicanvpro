using System.Net;
using System.Text.Json;

namespace ClinicaProNV.Api.Middlewares
{
    public sealed class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionHandlingMiddleware(RequestDelegate next) => _next = next;

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.ContentType = "application/json";

                var payload = JsonSerializer.Serialize(new { message = "Error interno", detail = ex.Message });
                await context.Response.WriteAsync(payload);
            }
        }
    }
}
