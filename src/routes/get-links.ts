import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import dayjs from "dayjs";
import { ClientError } from "../errors/client-error";

export async function getLinks(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/links',{
        schema: {
            params: z.object({
                tripeId: z.string().uuid(),
            }),
        },
    }, async (request)=> {
        const { tripeId } = request.params

        const trip = await prisma.trip.findUnique({
            where: { id: tripeId },
            include: {links: true,}
        })

        if (!trip) {
            throw new ClientError('Trip not found')
        }

        return {
            links: trip.links
        }
    })
}