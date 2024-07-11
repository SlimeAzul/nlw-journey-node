import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from 'zod';
import { prisma } from "../lib/prisma";
import nodemailer from 'nodemailer';
import dayjs from "dayjs";
import { getMailClient } from "../lib/mails";
import { ClientError } from "../errors/client-error";
import { env } from "../env";


export async function createTrip(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips',{
        schema: {
            body: z.object({
                destination: z.string().min(4),
                start_at: z.coerce.date(),
                end_at: z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),
                emails_to_invite: z.array(z.string().email()),
            })
        },
    }, async (request)=>{
        const {
            destination, 
            start_at, 
            end_at, 
            owner_name, 
            owner_email, 
            emails_to_invite
        } = request.body
        
        if(dayjs(start_at).isBefore(new Date())){
            throw new ClientError('Data de inicio da viagem invalida')
        }

        if(dayjs(start_at).isBefore(end_at)){
            throw new ClientError('Data de fim da viagem invalida')
        }

        const trip = await prisma.trip.create({
            data: {
                destination,
                start_at,
                end_at,
                participants: {
                    createMany: {
                        data: [
                            {
                                name:owner_name,
                                email:owner_email,
                                is_owner: true,
                                is_confirmed: true,
                            },
                            ...emails_to_invite.map((email) => {
                                return {email}
                            })
                        ],
                    },
                },
            },
        })

        const formattedStartDate = dayjs(start_at).format('LL')
        const formattedEndDate = dayjs(end_at).format('LL')

        const confirmationLink = `${env.API_BASE_URL}3/trip/${trip.id}/confirm`

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from:{
                name: 'Equipe bravo',
                address: 'babalu@pj.com'
            },
            to:{
                name: owner_name,
                address: owner_email
            },
            subject: `Confirme sua viagem para ${destination}`,
            html: `
                <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                    <p>Você solicitou a criação de uma viagem para ${destination}, Brasil nas datas de ${formattedStartDate} até ${formattedEndDate}</p>
                    <p></p>
                    <p>Par confirmar sua viagem, cllique no link abaixo:</p>
                    <p></p>
                    <p><a href="${confirmationLink}">confirmar viagem</a></p>
                    <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p>
                </div>
            `.trim()
        })

        return {tripId: trip.id}
    })
}