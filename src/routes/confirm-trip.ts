import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import dayjs from "dayjs";
import { getMailClient } from "../lib/mails";
import { env } from "../env";


export async function confirmTrip(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().get('/trips:tripId/confirm',{
        schema: {
            params: z.object({
                tripId: z.string().uuid()
            })
        },
    }, async (request, reply)=>{
        const {tripId} = request.params


        const trip = await prisma.trip.findUnique({
            where:{
                id: tripId
            },
            include: {
                participants:{
                    where : {
                        is_owner: false
                    }
                }
            }
        })

        if(!trip){
            throw new Error('Trip not found.')
        }

        if(trip.is_confirmed){
            return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
        }

        await prisma.trip.update({
            where: {id: tripId},
            data: {
                is_confirmed: true,
            },
        })

        const formattedStartDate = dayjs(trip.start_at).format('LL')
        const formattedEndDate = dayjs(trip.end_at).format('LL')

        const mail = await getMailClient()

        await Promise.all(
            trip.participants.map(async(participant) => {
                const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`

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
            })
        )

        return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
    })
}