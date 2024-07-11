import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import dayjs from "dayjs";
import { getMailClient } from "../lib/mails";
import { env } from "../env";

export async function createInvite(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/invites',{
        schema: {
            params: z.object({
                tripId: z.string().uuid(),
            }),

            body: z.object({
                email: z.string().email(),
            })
        },
    }, async (request)=> {
        const { tripId } = request.params
        const { email } = request.body

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
        })

        if (!trip) {
            throw new Error('Trip not found')
        }
        const participant = await prisma.participant.create({
            data:{
                email,
                trip_id: tripId
            }
        })

        const formattedStartDate = dayjs(trip.start_at).format('LL')
        const formattedEndDate = dayjs(trip.end_at).format('LL')

        const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from:{
                name: 'Equipe bravo',
                address: 'babalu@pj.com'
            },
            to: participant.email,
            subject: `Confirme sua viagem para ${trip.destination}`,
            html: `
                <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                    <p>Você doi convidado para participar de uma viagem para ${trip.destination}, nas datas de ${formattedStartDate} até ${formattedEndDate}</p>
                    <p></p>
                    <p>Par confirmar sua viagem, cllique no link abaixo:</p>
                    <p></p>
                    <p><a href="${confirmationLink}">confirmar viagem</a></p>
                    <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p>
                </div>
            `.trim()
        })

        return {
            participantId: participant.id
        }
    })
}