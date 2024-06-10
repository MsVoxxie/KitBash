const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const GIFEncoder = require('gifencoder');
const { GifReader } = require('omggif');
const fetch = require('node-fetch');
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('caption')
		.setDescription('Caption an image.')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addAttachmentOption((option) => option.setName('image').setDescription('The image to caption.').setRequired(true))
		.addStringOption((option) => option.setName('caption').setDescription('The caption to add to the image.').setRequired(true)),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction) {
		// Defer, Things take time.
		await interaction.deferReply();

		// Definitions
		const image = interaction.options.get('image');
		const caption = interaction.options.getString('caption');

		// Get image details
		const { width, height, contentType } = image.attachment;
		const imageURL = image.attachment.url;

		// Canvas setup
		const canvas = Canvas.createCanvas(width, height);
		const ctx = canvas.getContext('2d');

		// Register font from file
		Canvas.GlobalFonts.registerFromPath(path.join(__dirname, '../../fonts/Roboto-Bold.ttf'), 'Roboto-Bold');

		// Load image
		const img = await Canvas.loadImage(imageURL);
		ctx.drawImage(img, 0, 0, width, height);

		// Setup text
		const fontSize = Math.min(Math.max((width, height) / 16, 16), 256);
		ctx.font = `${fontSize}px Roboto-Bold`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// Draw caption on the top center of the image
		const lines = wrapText(ctx, caption, width);
		const padding = (fontSize * 1.5) / 3;
		const lineHeight = (fontSize * fontSize) / 25;
		const textHeight = lines.length * lineHeight + 2 * padding;

		//! Gif support hell
		if (contentType === 'image/gif') {
			const generatedGif = await textMagicGif(imageURL, ctx, lines, width, height, lineHeight, textHeight, fontSize);
			// Send the gif
			const gifAttachment = new AttachmentBuilder(generatedGif, { name: 'caption.gif' });
			await interaction.followUp({ files: [gifAttachment] });
		} else {
			// Generate Image
			const generatedFrame = textMagic(ctx, lines, width, height, lineHeight, textHeight, fontSize);

			// Send the image
			const imageAttachment = new AttachmentBuilder(generatedFrame.newCanvas.toBuffer('image/png'), { name: 'caption.png' });
			await interaction.followUp({ files: [imageAttachment] });
		}
	},
};

const textMagic = (ctx, lines, width, height, lineHeight, textHeight, fontSize) => {
	// Remake canvas with new height for textHeight
	const newCanvas = Canvas.createCanvas(width, height + textHeight);
	const newCtx = newCanvas.getContext('2d');

	// Draw the original image offset by textHeight
	newCtx.drawImage(ctx.canvas, 0, textHeight);

	newCtx.font = `${fontSize}px Roboto-Bold`;
	newCtx.textAlign = 'center';
	newCtx.textBaseline = 'middle';

	// Draw background
	newCtx.fillStyle = 'white';
	newCtx.fillRect(0, 0, width, textHeight);

	// Draw text
	newCtx.fillStyle = 'black';
	lines.forEach((line, i) => {
		newCtx.fillText(line, width / 2, height / 25 - lineHeight / 1.5 + (i + 1) * lineHeight);
	});
	return { newCtx, newCanvas };
};

const textMagicGif = async (imageURL, ctx, lines, width, height, lineHeight, textHeight, fontSize) => {
	// Remake canvas with new height for textHeight
	const newCanvas = Canvas.createCanvas(width, height + textHeight);
	const newCtx = newCanvas.getContext('2d');

	// Draw the original image offset by textHeight
	newCtx.drawImage(ctx.canvas, 0, textHeight);

	newCtx.font = `${fontSize}px Roboto-Bold`;
	newCtx.textAlign = 'center';
	newCtx.textBaseline = 'middle';

	// Get the gif frames
	const imageUrl = fetch(imageURL);
	const imageBuffer = await imageUrl.then((res) => res.buffer());
	const gifData = new GifReader(imageBuffer);
	const frameDelay = gifData.frameInfo(0).delay;

	// Create the encoder
	const encoder = new GIFEncoder(width, height);
	encoder.start();
	encoder.setRepeat(0);
	encoder.setDelay(frameDelay);

	// Loop through each frame
	for (let i = 0; i < gifData.numFrames(); i++) {
		// Get the frame
		const frameInfo = gifData.frameInfo(i);
		const frameData = Buffer.alloc(frameInfo.width * frameInfo.height * 4);
		gifData.decodeAndBlitFrameRGBA(i, frameData);

		// Put the frame data on the canvas
		const imageData = ctx.createImageData(frameInfo.width, frameInfo.height);
		imageData.data.set(frameData);

		// Draw the frame
		newCtx.putImageData(imageData, 0, 0);

		// Draw background
		newCtx.fillStyle = 'white';
		newCtx.fillRect(0, 0, width, textHeight);

		// Draw text
		newCtx.fillStyle = 'black';
		lines.forEach((line, i) => {
			newCtx.fillText(line, width / 2, height / 25 - lineHeight / 3 + (i + 1) * lineHeight);
		});

		encoder.addFrame(newCtx);
	}
	encoder.finish();

	return encoder.out.getData();
};

const wrapText = (context, text, maxWidth) => {
	const words = text.split(' ');
	let line = '';
	const lines = [];

	for (let i = 0; i < words.length; i++) {
		const testLine = line + words[i] + ' ';
		const metrics = context.measureText(testLine);
		const testWidth = metrics.width;

		if (testWidth > maxWidth && i > 0) {
			lines.push(line.trim());
			line = words[i] + ' ';
		} else {
			line = testLine;
		}
	}
	lines.push(line.trim());
	return lines;
};
