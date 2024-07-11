import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import dayjs from "dayjs";
import { ClientError } from "../errors/client-error";


export async function getActivity(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/activities',{
        schema: {
            params: z.object({
                tripeId: z.string().uuid(),
            }),
        },
    }, async (request)=> {
        const { tripeId } = request.params

        const trip = await prisma.trip.findUnique({
            where: { id: tripeId },
            include: {activities: {
                orderBy: {
                    occurs_at: 'asc'
                }
            }}
        })

        if (!trip) {
            throw new ClientError('Trip not found')
        }

        const diferenceInDaysBtweenTripStartAndEnd = dayjs(trip.end_at).diff(trip.start_at, 'days')

        const activities = Array.from({length: diferenceInDaysBtweenTripStartAndEnd+1 }).map((_,index) => {
            const date = dayjs(trip.start_at).add(index, 'days')

            return {
                date: date.toDate,
                activities: trip.activities.filter(activity => {
                    return dayjs(activity.occurs_at).isSame(date, 'day')
                })
            }
        })

        return {
            activities: trip.activities
        }
    })
}