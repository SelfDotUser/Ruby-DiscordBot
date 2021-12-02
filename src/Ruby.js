import configs from './config.json'
import fetch from "node-fetch";
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { Client, Intents, MessageActionRow, MessageButton } from "discord.js";
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

// TODO: remove "false" eph, 

const version = "2021.12.1 BETA";

async function graph(data, month, interaction) {
    var labels = []
    // Sets the labels for the x line
    for (const i of Array(31).keys()) {
        if (i+1 < 10) {
            labels.push("0" + String(i+1))
        } else {
            labels.push(String(i+1))
        }
        
    }

    var month_data = {}

    var data_keys = Object.keys(data)

    for (const i in data_keys) {
        if (data_keys[i].includes(month)) {
            month_data[data_keys[i]] = data[data_keys[i]]
        }
    }

    var data_keys = Object.keys(month_data)
    var data_to_graph = []

    for (const i in data_keys) {
        data_to_graph.push({x: data_keys[i].slice(8), y: month_data[data_keys[i]]})
    }


    const width = 600;
    const height = 500;
    const configuration = {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: 'Weight',
                data: data_to_graph,
                fill: true,
                borderColor: '#52CD7C',
                backgroundColor: "#2F3136",
                tension: 0.5
                }]
        },
        options: {
            indexAxis: 'x',
            scales: {
                y: {
                    beginAtZero: false,
                }
            }
        },
        plugins: [{
            id: 'background-colour',
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                ctx.fillStyle = '#36393F';
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
        // ChartJS.defaults.layout.padding = 10
    };
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });
    const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    // await fs.writeFile('./example.png', buffer, 'base64');

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
            const data = {
                "user_id": interaction.user.id,
                "weight": parseFloat(interaction.options.data[0].value)
            }
        
            fetch("https://ruby-weight-management.herokuapp.com/update-weight/", {
                "method": "POST",
                "body": JSON.stringify(data),
                "headers": { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(data => {
                if (!data.status.toString().includes("ERROR"))
                {
                    graph(data.weight, data.current_month, interaction);
                    
                } else {
                    if (data.status.toString().includes("not in the database"))
                    {
                        const row = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('new_user')
                                .setLabel('Begin Journey')
                                .setStyle('SUCCESS')
                        );

                        interaction.editReply({content: "You are not in the database. Would you like to add yourself? :eyes:", components: [row], ephemeral: true})
                    } else {
                        interaction.editReply(data.status.toString())
                    }
                    
                }
            })
        }
        else if (interaction.commandName == "progress")
        {
            interaction.reply({content: "Getting data...", ephemeral: true})

            fetch(`https://ruby-weight-management.herokuapp.com/weight-${interaction.user.id}/`)
            .then(response => response.json())
            .then(data => {
                if (!data.status.toString().includes("ERROR")) {
                    graph(data.weight, data.current_month, interaction);
                } else {
                    if (data.status.toString().includes("not in the database"))
                    {
                        const row = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId('new_user')
                                .setLabel('Begin Journey')
                                .setStyle('SUCCESS')
                        );

                        interaction.editReply({content: "You are not in the database. Would you like to add yourself? :eyes:", components: [row], ephemeral: true})
                    } else {
                        interaction.editReply(data.status.toString())
                    }
                }
                
            });
            
        }
    }
    else if (interaction.isButton())
    {
        if (interaction.customId == "new_user")
        {
            const data = {
                "user_id": interaction.user.id,
            }
            
            fetch("https://ruby-weight-management.herokuapp.com/new-user/", {
                "method": "POST",
                "body": JSON.stringify(data),
                "headers": { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(data => {
                if (!data.status.toString().includes("ERROR")) {
                    interaction.reply({content: "You're in! :partying_face: Hit up `/record` to start graphing!", ephemeral: true})
                } else {
                    interaction.reply("An error occured. :(")
                    console.log(data.status)
                }
                
            });
        }
    }
});

client.login(process.env.BOT_TOKEN);

/*
node --experimental-json-modules Ruby.js
*/