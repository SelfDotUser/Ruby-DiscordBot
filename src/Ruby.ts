import fetch_node from "node-fetch";
import { ChartConfiguration } from "chart.js";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { Client, CommandInteraction, Intents, MessageActionRow, MessageButton } from "discord.js";
import { config } from "dotenv";

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

const version = "2021.12.7 TS";

if (version.includes("BETA")) {
    config();
}

interface ServerData {
    weight?: { [index: string]: number };
    message: string;
}

async function graph(data: ServerData, interaction: CommandInteraction): Promise<void> {
    var labels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 
                  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];

    var data_keys = Object.keys(data.weight);

    var data_to_graph = [];

    for (const i in data_keys) {
        data_to_graph.push({ x: parseInt(data_keys[i].slice(8)), y: data.weight[data_keys[i]] });
    }

    
    const width = 600;
    const height = 500;
    const configuration: ChartConfiguration = {
        type: "line",
        data: {
            labels: labels,
            datasets: [{ 
                label: "Weight",
                data: data_to_graph,
                fill: true,
                borderColor: "#52CD7C",
                backgroundColor: "#2F3136",
                tension: 0.2
             },
            {
                label: "Threshold",
                data: [{x: 1, y: data.weight[data_keys[0]]}, {x: 31, y: data.weight[data_keys[0]]}],
                fill: false,
                borderColor: "black",
                backgroundColor: "#2F3136",
                tension: 0
            }]
        },
        options: {
            indexAxis: "x",
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: Math.min(...Object.values(data.weight))-10,
                    suggestedMax: Math.max(...Object.values(data.weight))+10
                }
            },
            devicePixelRatio: 2
        },
        plugins: [{
            id: "background-color",
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                ctx.fillStyle = "#36393F",
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }
        }]
    };
    const chartCallback = (ChartJS) => {
        ChartJS.defaults.color = "#DBDDDD"
        ChartJS.defaults.font.weight = "bold"
        ChartJS.defaults.elements.point.radius = 3
        ChartJS.defaults.font.size = 15
        ChartJS.defaults.plugins.legend.labels.boxHeight = 0
        ChartJS.defaults.layout.padding = 20
    };
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });
    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);

    interaction.editReply({ content: ":eyes:", files: [buffer] });

}

client.on("ready", () => {
    /*
    If version is in beta, it's in DND with "Playing with beta features!" as its status. Otherwise, it's only online.
    */
    if (version.includes("BETA")) {
        client.user.setPresence({ activities: [{ name: "with TypeScript!" }], status: "dnd" });
        console.log("-----> WARNING: This is a beta version. Presence set to Do Not Disturb.");
    } else {
        client.user.setPresence({ status: "online" });
    }

    console.log(`-----> ${client.user.username} is online.`);
});

client.on("interactionCreate", (interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName == "record")
        {
            interaction.reply({content: "Getting data...", ephemeral: true})
            .catch(reason => {
                console.log("ERROR: I failed to send a message.\n" + reason.toString())
            });

            interface UpdateGraphData {
                user_id: string;
                weight: number;
            }

            var weight: string = interaction.options.data[0].value.toString()

            const data: UpdateGraphData = {
                "user_id": interaction.user.id,
                "weight": parseFloat(weight)
            }

            fetch_node("https://ruby-weight-management.herokuapp.com/api/update-weight/", {
                "method": "POST",
                "body": JSON.stringify(data),
                "headers": { "Content-Type": "application/json", "Authorization": 'Basic ' + Buffer.from(`${interaction.user.id}:${interaction.options.data[1].value}`, 'binary').toString('base64') }
            })
            .then(response => response.json())
            .then((data: ServerData) => {
                if (!data.message.toString().includes("ERROR"))
                {
                    graph(data, interaction);

                } else {
                    if (data.message.toString().includes("not in the database"))
                    {
                        const row = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId("new_user")
                                .setLabel("Begin Journey")
                                .setStyle("SUCCESS")
                        );

                        interaction.editReply({content: "You are not in the database. Would you like to add yourself? :eyes:", components: [row]})
                    } else {
                        interaction.editReply(data.message.toString())
                    }

                }
            }).catch(reason => {
                console.log("ERROR: I failed to get data from /api/update-weight/.\n" + reason.toString());
                interaction.editReply({content: "Sorry, an error occured. Please let SelfDotUser know." })
            });
        }
        else if (interaction.commandName == "progress")
        {
            interaction.reply({content: "Getting data...", ephemeral: true})

            fetch_node(`https://ruby-weight-management.herokuapp.com/api/weight/-/`, {
            "method": "GET",
            "headers": { "Content-Type": "application/json", "Authorization": 'Basic ' + Buffer.from(`${interaction.user.id}:${interaction.options.data[0].value}`, 'binary').toString('base64') }
        })
        
            .then(response => response.json())
            .then((data: ServerData) => {
                if (!data.message.toString().includes("ERROR")) {
                    graph(data, interaction);
                } else {
                    if (data.message.toString().includes("not in the database"))
                    {
                        const row = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId("new_user")
                                .setLabel("Begin Journey")
                                .setStyle("SUCCESS")
                        );

                        interaction.editReply({content: "You are not in the database. Would you like to add yourself? :eyes:", components: [row] })
                    } else {
                        interaction.editReply(data.message.toString())
                    }
                }

            })
            .catch(reason => {
                console.log(`ERROR: Failed to get data from /api/weight/-/.` + "\n" + reason.toString())
                interaction.editReply({content:"Sorry, an error occured. Please let SelfDotUser know." });
            })

        } else if (interaction.commandName == "new") {
                const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId("new_user")
                        .setLabel("Begin Journey")
                        .setStyle("SUCCESS")
                );

            interaction.reply({content: "Are you ready? :eyes:", components: [row], ephemeral: true})
        }
    }
    else if (interaction.isButton())
    {
        if (interaction.customId == "new_user")
        {
            var passcode = Math.round(Math.random() * (999999 - 100000) + 100000).toString()

            const data = {
                "user_id": interaction.user.id,
                "passcode": passcode
            }

            fetch_node("https://ruby-weight-management.herokuapp.com/api/new-user/", {
                "method": "POST",
                "body": JSON.stringify(data),
                "headers": { "Content-Type": "application/json" }
            })
            .then(response => response.json())
            .then((data: ServerData) => {
                if (!data.message.toString().includes("ERROR")) {
                    interaction.reply({content: "You're in! :partying_face: Hit up `/record` to start graphing!\n\n**NOTE:** Your passcode is " + passcode + ". DO NOT SHARE IT WITH ANYBODY. You need this to access Ruby features.", ephemeral: true})
                } else {
                    interaction.reply({content: "```" + data.message.toString() + "```", ephemeral: true})
                }

            }).catch(reason => {
                console.log("ERROR: Failed to post to /api/new-user/.\n" + reason.toString());
            });
        }
    }
});

client.login(process.env.BOT_TOKEN);
