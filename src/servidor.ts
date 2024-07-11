import fastify from "fastify";
import cors from '@fastify/cors'
import { createTrip } from "./routes/create-trip.js";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { confirmTrip } from "./routes/confirm-trip.js";
import { confirmParticipants } from "./routes/confirm-participant.js";
import { getActivity } from "./routes/get-activity.js";
import { createActivity } from "./routes/create-activity.js";
import { createLink } from "./routes/create-link.js";
import { getParticipants } from "./routes/get-participants.js";
import { getLinks } from "./routes/get-links.js";
import { createInvite } from "./routes/create-invite.js";
import { getTripDetails } from "./routes/get-trip-details.js";
import { updateTrip } from "./routes/update-trip.js";
import { getParticipant } from "./routes/get-participant.js";
import {errorHandler} from "./error-handler.js";
import { env } from "./env.js";

const app = fastify()

app.register(cors, {
    origin: '*',
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.setErrorHandler(errorHandler)
app.register(createTrip)
app.register(createActivity)
app.register(createLink)
app.register(createInvite)
app.register(confirmTrip)
app.register(confirmParticipants)
app.register(getLinks)
app.register(getActivity)
app.register(getParticipants)
app.register(getTripDetails)
app.register(getParticipant)
app.register(updateTrip)


app.listen({port: env.PORT}).then(() => {
    console.log("server running")
})