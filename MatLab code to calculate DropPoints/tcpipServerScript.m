
tcpipServer = tcpip('0.0.0.0', 8080, 'NetworkRole', 'Server');
set(tcpipServer, 'InputBufferSize', 10000);
set(tcpipServer, 'Timeout', 30);
set(tcpipServer, 'OutputBufferSize', 40000);
while(1)
    fopen(tcpipServer);
    while(1)
        while (tcpipServer.BytesAvailable == 0)
        end
        receivedMessage = fread(tcpipServer, tcpipServer.BytesAvailable,'char');
        intarray = sscanf(char(receivedMessage), '%f ');
        disp 'received the following array: ';
        %if input is invalid, the intarray value == 0
        if isempty(intarray)
            fprintf(1, 'invalid message received by user. must be comma separated vector\n');
        else
            %Process message
            user = mat2str(intarray(end)); %Pick off user ID for use when result is sent back
            intarray = intarray(1:end-1);
            %dotProductResult  = dotProduct(intarray); %Sample function demonstrating use of array type
            disp(intarray);
            sizeOfIntArray = size(intarray);
            lengthOfArray = sizeOfIntArray(1,1);
            inputToComp = zeros(lengthOfArray/2, 2);
            for j=1:lengthOfArray
                col = mod(j,2);
                if (col == 0)
                    col = 2;
                else
                    col = 1;
                end
                row = floor((j/2 +0.5));
                inputToComp(row, col) = intarray(j,1);
            end
            disp(inputToComp);
            result = CalcDropPoints(inputToComp);
            disp(result);
            sizeResult = size(result);
            %resultToSend = reshape(result, 1, sizeResult(1,1)*sizeResult(1,2));
            stringResult = mat2str(result);
            disp(stringResult);
            fwrite(tcpipServer, [stringResult ' ' user]);
            %disp(inputToComp);
            % Sends our result to client
            %stringResult = mat2str(dotProductResult);
            %fwrite(tcpipServer, [stringResult ' ' user]);
        end
    end
    fclose(tcpipServer);
end

fclose(tcpipServer);