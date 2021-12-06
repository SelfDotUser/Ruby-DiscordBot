import fetch from "node-fetch";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { Client, Intents, MessageActionRow, MessageButton } from "discord.js";
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });
import {config} from "dotenv"

const version = "2021.12.6 TS BETA";

if (version.includes("BETA")) {
    config()
}

async function graph(data, interaction) {
    var labels = [];
    // Sets the labels for the x line
    for (const i of Array(31).keys()) {
        if (i+1 < 10) {
            labels.push("0" + String(i+1))
        } else {
            labels.push(String(i+1))
        }

    }

    var data_keys = Object.keys(data)

    var data_to_graph = []

    for (const i in data_keys) {
        data_to_graph.push({x: data_keys[i].slice(8), y: data[data_keys[i]]})
    }


    const width = 600;
    const height = 500;
    const configuration = {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Weight",
                data: data_to_graph,
                fill: true,
                borderColor: "#52CD7C",
                backgroundColor: "#2F3136",
                tension: 0.2,
                },
            {
                label: "Threshold",
                data: [{x: "01", y: data[data_keys[0]]}, {x: "31", y: data[data_keys[0]]}],
                fill: false,
                borderColor: "black",
                backgroundColor: "#2F3136",
                tension: 0,
                elements: {point: {radius: 0}, line: {borderDash: [5]}}
            }]
        },
        options: {
            indexAxis: "x",
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: Math.min(...Object.values(data))-10,
                    suggestedMax: Math.max(...Object.values(data))+10
                }
            },
            devicePixelRatio: 2
        },
        plugins: [{
            id: "background-colour",
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                ctx.fillStyle = "#36393F";
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
    // await fs.writeFile('./graph.png', buffer, 'base64');

    interaction.editReply({content: ":eyes:", ephemeral: true, files: [buffer]});

}

client.on("ready", () => {
    /*
    If version is in beta, it's in DND with "Playing with beta features!" as its status. Otherwise, it's only online.
    */
    if (version.includes("BETA")) {
        client.user.setPresence({activities: [{name: "with beta features!"}], status: "dnd"});
        console.log("-----> WARNING: This is a beta version. Presence set to Do Not Disturb.");
    } else {
        client.user.setPresence({status: "online"});
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
            const data = {
                "user_id": interaction.user.id,
                "weight": parseFloat(interaction.options.data[0].value)
            }

            fetch("https://ruby-weight-management.herokuapp.com/api/update-weight/", {
                "method": "POST",
                "body": JSON.stringify(data),
                "headers": { "Content-Type": "application/json", "Authorization": 'Basic ' + Buffer.from(`${interaction.user.id}:${interaction.options.data[1].value}`, 'binary').toString('base64') }
            })
            .then(response => response.json())
            .then(data => {
                if (!data.message.toString().includes("ERROR"))
                {
                    graph(data.weight, interaction);

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

                        interaction.editReply({content: "You are not in the database. Would you like to add yourself? :eyes:", components: [row], ephemeral: true})
                    } else {
                        interaction.editReply(data.message.toString())
                    }

                }
            }).catch(reason => {
                console.log("ERROR: I failed to get data from /api/update-weight/.\n" + reason.toString());
                interaction.editReply({content: "Sorry, an error occured. Please let SelfDotUser know.", ephemeral: true})
            });
        }
        else if (interaction.commandName == "progress")
        {
            interaction.reply({content: "Getting data...", ephemeral: true})

            fetch(`https://ruby-weight-management.herokuapp.com/api/weight/-/`, {
            "method": "GET",
            "headers": { "Content-Type": "application/json", "Authorization": 'Basic ' + Buffer.from(`${interaction.user.id}:${interaction.options.data[0].value}`, 'binary').toString('base64') }
        })
        
            .then(response => response.json())
            .then(data => {
                if (!data.message.toString().includes("ERROR")) {
                    graph(data.weight, interaction);
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

                        interaction.editReply({content: "You are not in the database. Would you like to add yourself? :eyes:", components: [row], ephemeral: true})
                    } else {
                        interaction.editReply(data.message.toString())
                    }
                }

            })
            .catch(reason => {
                console.log(`ERROR: Failed to get data from /api/weight/-/.` + "\n" + reason.toString())
                interaction.editReply({content:"Sorry, an error occured. Please let SelfDotUser know.", ephemeral: true});
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

            fetch("https://ruby-weight-management.herokuapp.com/api/new-user/", {
                "method": "POST",
                "body": JSON.stringify(data),
                "headers": { "Content-Type": "application/json" }
            })
            .then(response => response.json())
            .then(data => {
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
